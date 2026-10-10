using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RetailHub.Application.Common;
using RetailHub.Application.Interfaces;

namespace RetailHub.Infrastructure.Identity;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<AppRole> _roleManager;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        UserManager<AppUser> userManager,
        RoleManager<AppRole> roleManager,
        IOptions<JwtSettings> jwtSettings)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<Result<AuthResult>> LoginAsync(string username, string password, CancellationToken ct)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user is null || !user.IsActive)
            return Result<AuthResult>.Failure("اسم المستخدم أو كلمة المرور غير صحيحة");

        var validPassword = await _userManager.CheckPasswordAsync(user, password);
        if (!validPassword)
            return Result<AuthResult>.Failure("اسم المستخدم أو كلمة المرور غير صحيحة");

        return await GenerateAuthResult(user);
    }

    public async Task<Result<AuthResult>> RefreshTokenAsync(string accessToken, string refreshToken, CancellationToken ct)
    {
        var principal = GetPrincipalFromExpiredToken(accessToken);
        if (principal is null)
            return Result<AuthResult>.Failure("Access token غير صالح");

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId is null)
            return Result<AuthResult>.Failure("Access token غير صالح");

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
            return Result<AuthResult>.Failure("المستخدم غير موجود أو معطل");

        if (user.RefreshToken != refreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return Result<AuthResult>.Failure("Refresh token غير صالح أو منتهي الصلاحية");

        return await GenerateAuthResult(user);
    }

    public async Task<Result<Guid>> RegisterAsync(string fullName, string username, string password, string role, CancellationToken ct)
    {
        var existingUser = await _userManager.FindByNameAsync(username);
        if (existingUser is not null)
            return Result<Guid>.Failure("اسم المستخدم مستخدم بالفعل");

        // Ensure role exists
        if (!await _roleManager.RoleExistsAsync(role))
        {
            await _roleManager.CreateAsync(new AppRole(role));
        }

        var user = new AppUser
        {
            FullName = fullName,
            UserName = username,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return Result<Guid>.Failure(string.Join(" | ", errors));
        }

        await _userManager.AddToRoleAsync(user, role);

        return Result<Guid>.Success(user.Id);
    }

    public async Task<Result> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure("المستخدم غير موجود");

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return Result.Failure(string.Join(" | ", errors));
        }

        // Invalidate refresh token on password change
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        return Result.Success();
    }

    // ── Private helpers ──

    private async Task<Result<AuthResult>> GenerateAuthResult(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Cashier";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName!),
            new("fullName", user.FullName),
            new(ClaimTypes.Role, role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        // Generate refresh token
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        await _userManager.UpdateAsync(user);

        return Result<AuthResult>.Success(new AuthResult
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new UserInfo
            {
                Id = user.Id,
                FullName = user.FullName,
                Username = user.UserName!,
                Role = role
            }
        });
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = _jwtSettings.Audience,
            ValidateIssuer = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey)),
            ValidateLifetime = false // Allow expired tokens for refresh
        };

        try
        {
            var principal = new JwtSecurityTokenHandler()
                .ValidateToken(token, tokenValidationParameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }
}

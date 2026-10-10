using RetailHub.Application.Common;

namespace RetailHub.Application.Interfaces;

/// <summary>
/// Authentication service abstraction. Implemented in Infrastructure using ASP.NET Identity.
/// </summary>
public interface IAuthService
{
    Task<Result<AuthResult>> LoginAsync(string username, string password, CancellationToken ct = default);
    Task<Result<AuthResult>> RefreshTokenAsync(string accessToken, string refreshToken, CancellationToken ct = default);
    Task<Result<Guid>> RegisterAsync(string fullName, string username, string password, string role, CancellationToken ct = default);
    Task<Result> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default);
}

public class AuthResult
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public UserInfo User { get; init; } = null!;
}

public class UserInfo
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
}

using System.Security.Claims;
using RetailHub.Application.Interfaces;

namespace RetailHub.API.Services;

/// <summary>
/// Extracts the current authenticated user's claims from HttpContext.
/// </summary>
public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
        => _httpContextAccessor = httpContextAccessor;

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid UserId =>
        Guid.TryParse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id)
            ? id : Guid.Empty;

    public string Username => User?.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;

    public string Role => User?.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
}

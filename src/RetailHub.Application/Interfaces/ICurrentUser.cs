namespace RetailHub.Application.Interfaces;

/// <summary>
/// Provides access to the currently authenticated user's claims.
/// Implemented in the API layer from HttpContext.
/// </summary>
public interface ICurrentUser
{
    Guid UserId { get; }
    string Username { get; }
    string Role { get; }
    bool IsAuthenticated { get; }
}

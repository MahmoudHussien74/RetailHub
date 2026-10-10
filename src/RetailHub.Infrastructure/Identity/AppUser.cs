using Microsoft.AspNetCore.Identity;

namespace RetailHub.Infrastructure.Identity;

/// <summary>
/// Application user entity. Lives in Infrastructure to keep the Domain layer free from Identity dependencies.
/// </summary>
public class AppUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    /// <summary>Opaque refresh token stored after login.</summary>
    public string? RefreshToken { get; set; }

    /// <summary>When the current refresh token expires.</summary>
    public DateTime? RefreshTokenExpiryTime { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Application role entity.
/// </summary>
public class AppRole : IdentityRole<Guid>
{
    public AppRole() { }
    public AppRole(string roleName) : base(roleName) { }
}

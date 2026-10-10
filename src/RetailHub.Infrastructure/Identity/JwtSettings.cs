namespace RetailHub.Infrastructure.Identity;

/// <summary>
/// JWT configuration settings bound from appsettings.json "Jwt" section.
/// </summary>
public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string SecretKey { get; init; } = string.Empty;
    public string Issuer { get; init; } = "RetailHub";
    public string Audience { get; init; } = "RetailHub.Client";
    public int AccessTokenExpirationMinutes { get; init; } = 60;
    public int RefreshTokenExpirationDays { get; init; } = 7;
}

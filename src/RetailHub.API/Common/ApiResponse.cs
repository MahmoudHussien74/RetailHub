namespace RetailHub.API.Common;

/// <summary>
/// Standardized API response wrapper used by all controllers.
/// Frontend distinguishes errors using:
///   - Errors != null → field-level validation messages (highlight specific fields)
///   - Message != null (with no Errors) → general business-rule failure (show toast/alert)
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public T? Data { get; init; }
    public IReadOnlyList<string>? Errors { get; init; }
}

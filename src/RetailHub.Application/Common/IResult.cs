namespace RetailHub.Application.Common;

/// <summary>
/// Contract that all Result types must implement.
/// Uses static abstract interface members (C# 11+) so the ValidationBehavior
/// can construct the correct concrete type without reflection.
/// See static_abstract_explainer.md for full rationale.
/// </summary>
public interface IResult<TSelf> where TSelf : IResult<TSelf>
{
    bool IsSuccess { get; }
    string? Error { get; }
    IReadOnlyList<string> ValidationErrors { get; }

    /// <summary>
    /// Factory method called by ValidationBehavior to short-circuit with validation errors.
    /// Each concrete Result type provides its own implementation.
    /// </summary>
    static abstract TSelf CreateValidationFailure(IReadOnlyList<string> errors);
}

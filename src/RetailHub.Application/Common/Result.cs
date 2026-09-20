namespace RetailHub.Application.Common;

/// <summary>
/// Non-generic Result for Commands that return success/failure only (no data).
/// </summary>
public class Result : IResult<Result>
{
    public bool IsSuccess { get; protected init; }
    public bool IsFailure => !IsSuccess;
    public string? Error { get; protected init; }
    public IReadOnlyList<string> ValidationErrors { get; protected init; } = [];

    protected Result() { }

    public static Result Success() =>
        new() { IsSuccess = true };

    public static Result Failure(string error) =>
        new() { IsSuccess = false, Error = error };

    public static Result CreateValidationFailure(IReadOnlyList<string> errors) =>
        new()
        {
            IsSuccess = false,
            Error = "One or more validation errors occurred.",
            ValidationErrors = errors
        };
}

/// <summary>
/// Generic Result for Commands/Queries that return data on success.
/// </summary>
public class Result<T> : IResult<Result<T>>
{
    public bool IsSuccess { get; protected init; }
    public bool IsFailure => !IsSuccess;
    public T? Value { get; protected init; }
    public string? Error { get; protected init; }
    public IReadOnlyList<string> ValidationErrors { get; protected init; } = [];

    protected Result() { }

    public static Result<T> Success(T value) =>
        new() { IsSuccess = true, Value = value };

    public static Result<T> Failure(string error) =>
        new() { IsSuccess = false, Error = error };

    public static Result<T> CreateValidationFailure(IReadOnlyList<string> errors) =>
        new()
        {
            IsSuccess = false,
            Error = "One or more validation errors occurred.",
            ValidationErrors = errors
        };
}

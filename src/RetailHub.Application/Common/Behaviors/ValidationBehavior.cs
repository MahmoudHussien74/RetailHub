using FluentValidation;
using MediatR;

namespace RetailHub.Application.Common.Behaviors;

/// <summary>
/// MediatR Pipeline Behavior that auto-runs FluentValidation validators
/// before any Command/Query handler. 
/// 
/// The constraint <c>where TResponse : IResult&lt;TResponse&gt;</c> ensures:
/// 1. Every request must return a Result type (compile-time enforcement).
/// 2. We can call <c>TResponse.CreateValidationFailure(...)</c> to construct
///    the correct concrete type without reflection.
/// 
/// See static_abstract_explainer.md for full rationale on this design.
/// </summary>
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    where TResponse : IResult<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // If no validators registered for this request, skip validation
        if (!_validators.Any())
            return await next(cancellationToken);

        var context = new ValidationContext<TRequest>(request);

        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var errors = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .Select(f => f.ErrorMessage)
            .Distinct()
            .ToList();

        if (errors.Count != 0)
            return TResponse.CreateValidationFailure(errors);

        return await next(cancellationToken);
    }
}

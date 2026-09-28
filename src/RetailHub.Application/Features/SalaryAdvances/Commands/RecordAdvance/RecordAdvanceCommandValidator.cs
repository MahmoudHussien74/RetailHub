using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.SalaryAdvances.Commands.RecordAdvance;

public class RecordAdvanceCommandValidator : AbstractValidator<RecordAdvanceCommand>
{
    public RecordAdvanceCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty();

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MustBePositive], localizer[MessageKeys.AdvanceAmount]));
    }
}

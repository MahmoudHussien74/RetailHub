using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Employees.Commands.CreateEmployee;

public class CreateEmployeeCommandValidator : AbstractValidator<CreateEmployeeCommand>
{
    public CreateEmployeeCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage(_ => string.Format(localizer[MessageKeys.RequiredField], localizer[MessageKeys.EmployeeName]))
            .MaximumLength(200)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.EmployeeName], 200));

        RuleFor(x => x.BaseSalary)
            .GreaterThanOrEqualTo(0)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MustNotBeNegative], localizer[MessageKeys.EmployeeBaseSalary]));

        RuleFor(x => x.Phone)
            .MaximumLength(20)
            .When(x => x.Phone != null);

        RuleFor(x => x.Role)
            .MaximumLength(100)
            .When(x => x.Role != null);
    }
}

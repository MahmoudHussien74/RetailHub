using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Customers.Commands.UpdateCustomer;

public class UpdateCustomerCommandValidator : AbstractValidator<UpdateCustomerCommand>
{
    public UpdateCustomerCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.CustomerName]))
            .MaximumLength(200)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.MaxLengthExceeded],
                localizer[MessageKeys.CustomerName], 200));

        RuleFor(x => x.Phone)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.CustomerPhone]))
            .MaximumLength(20)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.MaxLengthExceeded],
                localizer[MessageKeys.CustomerPhone], 20));
    }
}

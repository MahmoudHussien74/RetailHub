using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Suppliers.Commands.CreateSupplier;

public class CreateSupplierCommandValidator : AbstractValidator<CreateSupplierCommand>
{
    public CreateSupplierCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.SupplierName]))
            .MaximumLength(200)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.MaxLengthExceeded],
                localizer[MessageKeys.SupplierName], 200));
    }
}

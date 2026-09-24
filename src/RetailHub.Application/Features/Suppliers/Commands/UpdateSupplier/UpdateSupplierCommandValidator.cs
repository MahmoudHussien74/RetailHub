using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Suppliers.Commands.UpdateSupplier;

public class UpdateSupplierCommandValidator : AbstractValidator<UpdateSupplierCommand>
{
    public UpdateSupplierCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Id).NotEmpty();

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

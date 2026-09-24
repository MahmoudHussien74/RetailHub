using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Returns.Commands.CreateReturnInvoice;

public class CreateReturnInvoiceCommandValidator : AbstractValidator<CreateReturnInvoiceCommand>
{
    public CreateReturnInvoiceCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.OriginalInvoiceId)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.ReturnOriginalInvoice]));

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage(_ => localizer[MessageKeys.ReturnItemsRequired].Value);

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.InvoiceItemId)
                .NotEmpty()
                .WithMessage(_ => string.Format(
                    localizer[MessageKeys.RequiredField],
                    localizer[MessageKeys.ReturnInvoiceItemId]));

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0)
                .WithMessage(_ => string.Format(
                    localizer[MessageKeys.MustBePositive],
                    localizer[MessageKeys.ReturnQuantity]));
        });
    }
}

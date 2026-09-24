using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Invoices.Commands.CreateSaleInvoice;

public class CreateSaleInvoiceCommandValidator : AbstractValidator<CreateSaleInvoiceCommand>
{
    public CreateSaleInvoiceCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage(_ => localizer[MessageKeys.InvoiceItemsRequired].Value);

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId)
                .NotEmpty()
                .WithMessage(_ => string.Format(
                    localizer[MessageKeys.RequiredField],
                    localizer[MessageKeys.InvoiceProductId]));

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0)
                .WithMessage(_ => string.Format(
                    localizer[MessageKeys.MustBePositive],
                    localizer[MessageKeys.InvoiceQuantity]));
        });

        RuleFor(x => x.AmountPaid)
            .GreaterThanOrEqualTo(0)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.MustNotBeNegative],
                localizer[MessageKeys.InvoiceAmountPaid]));
    }
}

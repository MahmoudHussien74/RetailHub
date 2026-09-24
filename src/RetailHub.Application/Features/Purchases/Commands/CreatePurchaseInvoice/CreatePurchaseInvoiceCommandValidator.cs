using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Purchases.Commands.CreatePurchaseInvoice;

public class CreatePurchaseInvoiceCommandValidator : AbstractValidator<CreatePurchaseInvoiceCommand>
{
    public CreatePurchaseInvoiceCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.SupplierId)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.SupplierName]));

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage(_ => localizer[MessageKeys.PurchaseItemsRequired].Value);

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
                    localizer[MessageKeys.BatchQuantity]));

            item.RuleFor(i => i.UnitCost)
                .GreaterThanOrEqualTo(0)
                .WithMessage(_ => string.Format(
                    localizer[MessageKeys.MustNotBeNegative],
                    localizer[MessageKeys.BatchPurchasePrice]));

            item.RuleFor(i => i.ExpiryDate)
                .GreaterThan(DateTime.UtcNow)
                .WithMessage(_ => localizer[MessageKeys.ExpiryDateMustBeFuture].Value);
        });
    }
}

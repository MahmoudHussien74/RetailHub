using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.StockAdjustments.Commands.AdjustStock;

public class AdjustStockCommandValidator : AbstractValidator<AdjustStockCommand>
{
    public AdjustStockCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.ProductId)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.InvoiceProductId]));

        RuleFor(x => x.BatchId)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.BatchQuantity]));

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage(_ => localizer[MessageKeys.AdjustmentReasonRequired].Value)
            .MaximumLength(500)
            .WithMessage(_ => localizer[MessageKeys.AdjustmentReasonMaxLength].Value);

        When(x => x.Kind == StockAdjustmentKind.WriteOff, () =>
            RuleFor(x => x.Quantity)
                .GreaterThan(0)
                .WithMessage(_ => string.Format(
                    localizer[MessageKeys.MustBePositive],
                    localizer[MessageKeys.BatchQuantity])));

        When(x => x.Kind == StockAdjustmentKind.Count, () =>
            RuleFor(x => x.Quantity)
                .GreaterThanOrEqualTo(0)
                .WithMessage(_ => string.Format(
                    localizer[MessageKeys.MustNotBeNegative],
                    localizer[MessageKeys.BatchQuantity])));
    }
}

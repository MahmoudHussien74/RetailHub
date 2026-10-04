using FluentValidation;

namespace RetailHub.Application.Features.StockAdjustments.Commands.AdjustStock;

public class AdjustStockCommandValidator : AbstractValidator<AdjustStockCommand>
{
    public AdjustStockCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("المنتج مطلوب");
        RuleFor(x => x.BatchId).NotEmpty().WithMessage("التشغيلة مطلوبة");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("سبب التسوية مطلوب")
            .MaximumLength(500).WithMessage("السبب يجب ألا يتجاوز 500 حرف");

        When(x => x.Kind == StockAdjustmentKind.WriteOff, () =>
            RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("الكمية يجب أن تكون أكبر من صفر"));

        When(x => x.Kind == StockAdjustmentKind.Count, () =>
            RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0).WithMessage("الكمية الفعلية لا يمكن أن تكون سالبة"));
    }
}

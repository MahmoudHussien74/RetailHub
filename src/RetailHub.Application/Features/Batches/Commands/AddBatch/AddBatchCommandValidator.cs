using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Batches.Commands.AddBatch;

public class AddBatchCommandValidator : AbstractValidator<AddBatchCommand>
{
    public AddBatchCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.WarehouseId).NotEmpty();

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MustBePositive], localizer[MessageKeys.BatchQuantity]));

        RuleFor(x => x.PurchasePrice)
            .GreaterThan(0)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MustBePositive], localizer[MessageKeys.BatchPurchasePrice]));

        RuleFor(x => x.ExpiryDate)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage(_ => localizer[MessageKeys.ExpiryDateMustBeFuture].Value);
    }
}

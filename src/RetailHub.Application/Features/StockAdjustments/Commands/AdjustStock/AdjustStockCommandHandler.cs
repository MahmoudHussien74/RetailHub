using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.StockAdjustments.Commands.AdjustStock;

/// <summary>
/// Adjusts a single batch and records the reason as a StockMovement:
///  - WriteOff → StockMovement(Damage), Quantity = units removed (positive).
///  - Count    → StockMovement(Adjustment), Quantity = signed difference (counted - recorded).
/// Product.AverageCost is recalculated and everything is saved atomically.
/// </summary>
public class AdjustStockCommandHandler : IRequestHandler<AdjustStockCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public AdjustStockCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(AdjustStockCommand request, CancellationToken ct)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId, ct);
        if (product is null)
            return Result<Guid>.Failure(_localizer[MessageKeys.ProductNotFound]);

        // Tracked entities — including zero-quantity ones, so counts can bring a batch back to life.
        var batches = await _unitOfWork.Batches.GetByProductIdOrderedByExpiryAsync(request.ProductId, ct);
        var batch = batches.FirstOrDefault(b => b.Id == request.BatchId);
        if (batch is null)
            return Result<Guid>.Failure(_localizer[MessageKeys.BatchNotFoundForProduct]);

        var reason = request.Reason.Trim();
        StockMovement movement;

        if (request.Kind == StockAdjustmentKind.WriteOff)
        {
            if (request.Quantity <= 0)
                return Result<Guid>.Failure(string.Format(
                    _localizer[MessageKeys.MustBePositive],
                    _localizer[MessageKeys.BatchQuantity]));

            if (request.Quantity > batch.Quantity)
                return Result<Guid>.Failure(string.Format(
                    _localizer[MessageKeys.DamageQuantityExceedsBatch],
                    request.Quantity,
                    batch.Quantity));

            batch.DeductQuantity(request.Quantity);
            movement = StockMovement.Create(
                product.Id, batch.Id, StockMovementType.Damage, request.Quantity, notes: reason);
        }
        else
        {
            if (request.Quantity < 0)
                return Result<Guid>.Failure(string.Format(
                    _localizer[MessageKeys.MustNotBeNegative],
                    _localizer[MessageKeys.BatchQuantity]));

            var difference = request.Quantity - batch.Quantity;
            if (difference == 0)
                return Result<Guid>.Failure(_localizer[MessageKeys.StockAdjustmentNoDifference]);

            if (difference > 0)
                batch.AddQuantity(difference);
            else
                batch.DeductQuantity(-difference);

            movement = StockMovement.Create(
                product.Id, batch.Id, StockMovementType.Adjustment, difference, notes: reason);
        }

        await _unitOfWork.StockMovements.AddAsync(movement, ct);

        // `batches` holds the already-updated tracked instances, so no extra DB round-trip is needed.
        product.RecalculateAverageCost(batches);
        _unitOfWork.Products.Update(product);

        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(movement.Id);
    }
}

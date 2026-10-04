using MediatR;
using RetailHub.Application.Common;
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

    public AdjustStockCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<Guid>> Handle(AdjustStockCommand request, CancellationToken ct)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId, ct);
        if (product is null)
            return Result<Guid>.Failure("المنتج غير موجود");

        // Tracked entities — including zero-quantity ones, so counts can bring a batch back to life.
        var batches = await _unitOfWork.Batches.GetByProductIdOrderedByExpiryAsync(request.ProductId, ct);
        var batch = batches.FirstOrDefault(b => b.Id == request.BatchId);
        if (batch is null)
            return Result<Guid>.Failure("التشغيلة غير موجودة لهذا المنتج");

        var reason = request.Reason.Trim();
        StockMovement movement;

        if (request.Kind == StockAdjustmentKind.WriteOff)
        {
            if (request.Quantity <= 0)
                return Result<Guid>.Failure("الكمية يجب أن تكون أكبر من صفر");

            if (request.Quantity > batch.Quantity)
                return Result<Guid>.Failure(
                    $"الكمية المطلوب إعدامها ({request.Quantity}) أكبر من رصيد التشغيلة ({batch.Quantity})");

            batch.DeductQuantity(request.Quantity);
            movement = StockMovement.Create(
                product.Id, batch.Id, StockMovementType.Damage, request.Quantity, notes: reason);
        }
        else
        {
            if (request.Quantity < 0)
                return Result<Guid>.Failure("الكمية الفعلية لا يمكن أن تكون سالبة");

            var difference = request.Quantity - batch.Quantity;
            if (difference == 0)
                return Result<Guid>.Failure("الكمية الفعلية مطابقة للرصيد المسجل، لا توجد تسوية");

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

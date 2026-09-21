using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Batches.Commands.AddBatch;

/// <summary>
/// Critical handler: Creates Batch + StockMovement(Purchase) + recalculates Product.AverageCost
/// in a single SaveChangesAsync() call (atomic transaction).
/// </summary>
public class AddBatchCommandHandler : IRequestHandler<AddBatchCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public AddBatchCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(AddBatchCommand request, CancellationToken ct)
    {
        // 1. Verify product exists
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId, ct);
        if (product is null)
            return Result<Guid>.Failure(_localizer[MessageKeys.ProductNotFound]);

        // 2. Create the new Batch
        var batch = Batch.Create(
            request.ProductId,
            request.WarehouseId,
            request.PurchasePrice,
            request.Quantity,
            request.ExpiryDate,
            request.SupplierId);

        await _unitOfWork.Batches.AddAsync(batch, ct);

        // 3. Record StockMovement (Type = Purchase)
        var movement = StockMovement.Create(
            request.ProductId,
            batch.Id,
            StockMovementType.Purchase,
            request.Quantity);

        await _unitOfWork.StockMovements.AddAsync(movement, ct);

        // 4. Recalculate AverageCost — load all available batches for this product
        var availableBatches = await _unitOfWork.Batches
            .GetAvailableBatchesByProductIdAsync(request.ProductId, ct);

        // Include the new batch (it's tracked but not yet saved to DB)
        availableBatches.Add(batch);

        product.RecalculateAverageCost(availableBatches);
        _unitOfWork.Products.Update(product);

        // 5. Single SaveChangesAsync — all-or-nothing atomic operation
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(batch.Id);
    }
}

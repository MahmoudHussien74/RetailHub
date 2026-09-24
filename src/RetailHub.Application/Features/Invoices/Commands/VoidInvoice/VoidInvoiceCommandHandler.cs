using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Invoices.Commands.VoidInvoice;

/// <summary>
/// Voids an invoice: restores batch quantities, creates reversal stock movements,
/// recalculates AverageCost. No hard delete — IsVoided = true.
/// All operations in a single SaveChangesAsync (atomic).
/// </summary>
public class VoidInvoiceCommandHandler : IRequestHandler<VoidInvoiceCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public VoidInvoiceCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(VoidInvoiceCommand request, CancellationToken ct)
    {
        // 1. Load invoice with items
        var invoice = await _unitOfWork.Invoices.GetByIdWithItemsAsync(request.InvoiceId, ct);
        if (invoice is null)
            return Result.Failure(_localizer[MessageKeys.InvoiceNotFound]);

        if (invoice.IsVoided)
            return Result.Failure(_localizer[MessageKeys.InvoiceAlreadyVoided]);

        // 2. Restore batch quantities and create reversal stock movements
        var affectedProductIds = new HashSet<Guid>();

        foreach (var item in invoice.Items)
        {
            // Load the batch to restore quantity
            var batches = await _unitOfWork.Batches
                .GetAvailableBatchesByProductIdAsync(item.ProductId, ct);

            // Find the specific batch (may have zero quantity now)
            var allBatches = await _unitOfWork.Batches
                .GetByProductIdOrderedByExpiryAsync(item.ProductId, ct);

            var batch = allBatches.FirstOrDefault(b => b.Id == item.BatchId);
            if (batch is not null)
            {
                // Restore quantity to original batch
                batch.AddQuantity(item.Quantity);

                // Create reversal stock movement
                var reversalMovement = StockMovement.Create(
                    item.ProductId,
                    item.BatchId,
                    StockMovementType.Return,
                    item.Quantity,
                    referenceId: invoice.Id);

                await _unitOfWork.StockMovements.AddAsync(reversalMovement, ct);
            }

            affectedProductIds.Add(item.ProductId);
        }

        // 3. Mark invoice as voided
        invoice.Void();
        _unitOfWork.Invoices.Update(invoice);

        // 4. Recalculate AverageCost for all affected products
        foreach (var productId in affectedProductIds)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(productId, ct);
            if (product is not null)
            {
                var updatedBatches = await _unitOfWork.Batches
                    .GetAvailableBatchesByProductIdAsync(productId, ct);

                product.RecalculateAverageCost(updatedBatches);
                _unitOfWork.Products.Update(product);
            }
        }

        // 5. Single atomic SaveChangesAsync
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}

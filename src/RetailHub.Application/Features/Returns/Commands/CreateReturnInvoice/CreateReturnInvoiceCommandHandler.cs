using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Returns.Commands.CreateReturnInvoice;

/// <summary>
/// Processes a return against an original sale invoice.
/// 
/// Algorithm:
/// 1. Validate original invoice exists and is not voided
/// 2. For each return item: validate InvoiceItemId exists in original, 
///    check (original qty - already returned qty) ≥ requested return qty
/// 3. Create ReturnInvoice with calculated TotalRefundAmount
/// 4. For each item:
///    - Sellable (not damaged): Batch.AddQuantity + StockMovement(Return)
///    - Damaged: StockMovement(Damage) only — no stock restoration
///    - Create ReturnInvoiceItem
/// 5. If credit invoice → adjust Customer.Balance (decrease debt by refund amount)
/// 6. Recalculate AverageCost for all affected products
/// 7. Single SaveChangesAsync — all or nothing
/// </summary>
public class CreateReturnInvoiceCommandHandler : IRequestHandler<CreateReturnInvoiceCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreateReturnInvoiceCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(CreateReturnInvoiceCommand request, CancellationToken ct)
    {
        // ── 1. Load original invoice with items ──
        var originalInvoice = await _unitOfWork.Invoices.GetByIdWithItemsAsync(request.OriginalInvoiceId, ct);
        if (originalInvoice is null)
            return Result<Guid>.Failure(_localizer[MessageKeys.InvoiceNotFound]);

        if (originalInvoice.IsVoided)
            return Result<Guid>.Failure(_localizer[MessageKeys.InvoiceAlreadyVoided]);

        // ── 2. Validate each return item against original invoice ──
        var totalRefundAmount = 0m;
        var affectedProductIds = new HashSet<Guid>();

        // Build lookup of original invoice items
        var originalItemsLookup = originalInvoice.Items.ToDictionary(i => i.Id);

        foreach (var returnItem in request.Items)
        {
            if (!originalItemsLookup.TryGetValue(returnItem.InvoiceItemId, out var originalItem))
                return Result<Guid>.Failure(string.Format(
                    _localizer[MessageKeys.ReturnInvoiceItemNotFound],
                    returnItem.InvoiceItemId));

            // Check double-return prevention
            var alreadyReturned = await _unitOfWork.ReturnInvoices
                .GetReturnedQuantityByInvoiceItemIdAsync(returnItem.InvoiceItemId, ct);

            var maxReturnable = originalItem.Quantity - alreadyReturned;
            if (returnItem.Quantity > maxReturnable)
                return Result<Guid>.Failure(string.Format(
                    _localizer[MessageKeys.ReturnQuantityExceeded],
                    originalItem.Product?.NameAr ?? originalItem.ProductId.ToString(),
                    maxReturnable,
                    returnItem.Quantity));

            totalRefundAmount += returnItem.Quantity * originalItem.UnitPriceAtSale;
            affectedProductIds.Add(originalItem.ProductId);
        }

        // ── 3. Create ReturnInvoice ──
        var returnInvoice = ReturnInvoice.Create(
            originalInvoice.Id,
            totalRefundAmount,
            originalInvoice.CustomerId);

        await _unitOfWork.ReturnInvoices.AddAsync(returnInvoice, ct);

        // ── 4. Process each return item ──
        foreach (var returnItem in request.Items)
        {
            var originalItem = originalItemsLookup[returnItem.InvoiceItemId];

            if (!returnItem.IsDamaged)
            {
                // Sellable return: restore stock to original batch
                var allBatches = await _unitOfWork.Batches
                    .GetByProductIdOrderedByExpiryAsync(originalItem.ProductId, ct);

                var batch = allBatches.FirstOrDefault(b => b.Id == originalItem.BatchId);
                batch?.AddQuantity(returnItem.Quantity);

                // Record stock movement (Return type)
                var returnMovement = StockMovement.Create(
                    originalItem.ProductId,
                    originalItem.BatchId,
                    StockMovementType.Return,
                    returnItem.Quantity,
                    referenceId: returnInvoice.Id);

                await _unitOfWork.StockMovements.AddAsync(returnMovement, ct);
            }
            else
            {
                // Damaged: record as damage — no stock restoration
                var damageMovement = StockMovement.Create(
                    originalItem.ProductId,
                    originalItem.BatchId,
                    StockMovementType.Damage,
                    returnItem.Quantity,
                    referenceId: returnInvoice.Id);

                await _unitOfWork.StockMovements.AddAsync(damageMovement, ct);
            }

            // Create ReturnInvoiceItem
            var returnInvoiceItem = ReturnInvoiceItem.Create(
                returnInvoiceId: returnInvoice.Id,
                invoiceItemId: originalItem.Id,
                productId: originalItem.ProductId,
                batchId: originalItem.BatchId,
                quantity: returnItem.Quantity,
                unitPriceAtSale: originalItem.UnitPriceAtSale,
                isDamaged: returnItem.IsDamaged);

            await _unitOfWork.ReturnInvoices.AddReturnItemAsync(returnInvoiceItem, ct);
        }

        // ── 5. If credit invoice → adjust Customer.Balance ──
        if (originalInvoice.CustomerId.HasValue)
        {
            var customer = await _unitOfWork.Customers
                .GetByIdAsync(originalInvoice.CustomerId.Value, ct);

            if (customer is not null)
            {
                // Decrease customer's debt by refund amount
                customer.AdjustBalance(-totalRefundAmount);
                _unitOfWork.Customers.Update(customer);
            }
        }

        // ── 6. Recalculate AverageCost for affected products ──
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

        // ── 7. Atomic save ──
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(returnInvoice.Id);
    }
}

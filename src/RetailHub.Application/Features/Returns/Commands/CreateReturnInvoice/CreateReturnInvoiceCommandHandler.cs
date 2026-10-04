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
/// Returns use the same unit as the original sale — BaseQuantity is restored to stock.
/// 
/// Algorithm:
/// 1. Validate original invoice exists and is not voided
/// 2. For each return item: validate InvoiceItemId exists in original, 
///    check (original qty - already returned qty) ≥ requested return qty
/// 3. Create ReturnInvoice with calculated TotalRefundAmount
/// 4. For each item:
///    - Calculate baseQtyToRestore = returnQty × originalItem.ConversionFactor
///    - Sellable (not damaged): Batch.AddQuantity(baseQtyToRestore) + StockMovement(Return)
///    - Damaged: StockMovement(Damage) only — no stock restoration
///    - Create ReturnInvoiceItem with unit snapshots from original
/// 5. If credit invoice → adjust Customer.Balance
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

            // Refund uses the actual net discounted unit price paid by the customer
            var effectiveUnitPrice = Math.Round(originalItem.NetUnitPrice, 2, MidpointRounding.AwayFromZero);
            // If original invoice as a whole had an overall header discount not on the item
            if (originalInvoice.DiscountPercent > 0 && originalItem.DiscountPercentage == 0)
            {
                effectiveUnitPrice = Math.Round(effectiveUnitPrice * (1m - (originalInvoice.DiscountPercent / 100m)), 2, MidpointRounding.AwayFromZero);
            }

            var lineRefund = Math.Round(returnItem.Quantity * effectiveUnitPrice, 2, MidpointRounding.AwayFromZero);
            totalRefundAmount += lineRefund;
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
            var baseQtyToRestore = returnItem.Quantity * originalItem.ConversionFactor;

            if (!returnItem.IsDamaged)
            {
                // Sellable return: restore base units to original batch
                var allBatches = await _unitOfWork.Batches
                    .GetByProductIdOrderedByExpiryAsync(originalItem.ProductId, ct);

                var batch = allBatches.FirstOrDefault(b => b.Id == originalItem.BatchId);
                batch?.AddQuantity(baseQtyToRestore);

                // Record stock movement (Return type, in base units)
                var returnMovement = StockMovement.Create(
                    originalItem.ProductId,
                    originalItem.BatchId,
                    StockMovementType.Return,
                    baseQtyToRestore,
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
                    baseQtyToRestore,
                    referenceId: returnInvoice.Id);

                await _unitOfWork.StockMovements.AddAsync(damageMovement, ct);
            }

            // Create ReturnInvoiceItem with unit snapshots and actual discount from original
            var returnInvoiceItem = ReturnInvoiceItem.Create(
                returnInvoiceId: returnInvoice.Id,
                invoiceItemId: originalItem.Id,
                productId: originalItem.ProductId,
                batchId: originalItem.BatchId,
                quantity: returnItem.Quantity,
                unitPriceAtSale: originalItem.UnitPriceAtSale,
                discountPercentage: originalItem.DiscountPercentage > 0 ? originalItem.DiscountPercentage : originalInvoice.DiscountPercent,
                isDamaged: returnItem.IsDamaged,
                unitName: originalItem.UnitName,
                conversionFactor: originalItem.ConversionFactor);

            await _unitOfWork.ReturnInvoices.AddReturnItemAsync(returnInvoiceItem, ct);
        }

        // ── 5. Payment & Balance Adjustment (Financial Accounting) ──
        if (originalInvoice.CustomerId.HasValue)
        {
            var customer = await _unitOfWork.Customers
                .GetByIdAsync(originalInvoice.CustomerId.Value, ct);

            if (customer is not null)
            {
                var unpaidAmount = Math.Max(0m, originalInvoice.TotalAmount - originalInvoice.AmountPaid);
                if (unpaidAmount > 0)
                {
                    // Credit/partial sale: reduce debt up to unpaid balance
                    var debtReduction = Math.Min(unpaidAmount, totalRefundAmount);
                    customer.AdjustBalance(-debtReduction);
                    _unitOfWork.Customers.Update(customer);

                    // Any refund exceeding the unpaid balance was paid in cash and is returned to the customer
                    var cashRefund = totalRefundAmount - debtReduction;
                    if (cashRefund > 0)
                    {
                        var cashTransaction = CashDrawerTransaction.Create(
                            CashDrawerTransactionType.Return,
                            -cashRefund,
                            referenceId: returnInvoice.Id,
                            notes: $"مرتجع فاتورة بيع رقم {originalInvoice.InvoiceNumber} (نقدي)");

                        await _unitOfWork.CashDrawerTransactions.AddAsync(cashTransaction, ct);
                    }
                }
                else
                {
                    // Fully paid: customer receives cash refund directly
                    var cashTransaction = CashDrawerTransaction.Create(
                        CashDrawerTransactionType.Return,
                        -totalRefundAmount,
                        referenceId: returnInvoice.Id,
                        notes: $"مرتجع فاتورة بيع رقم {originalInvoice.InvoiceNumber}");

                    await _unitOfWork.CashDrawerTransactions.AddAsync(cashTransaction, ct);
                }
            }
        }
        else if (totalRefundAmount > 0)
        {
            // Cash / Walk-in sale: refund cash from drawer
            var cashTransaction = CashDrawerTransaction.Create(
                CashDrawerTransactionType.Return,
                -totalRefundAmount,
                referenceId: returnInvoice.Id,
                notes: $"مرتجع فاتورة بيع رقم {originalInvoice.InvoiceNumber}");

            await _unitOfWork.CashDrawerTransactions.AddAsync(cashTransaction, ct);
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

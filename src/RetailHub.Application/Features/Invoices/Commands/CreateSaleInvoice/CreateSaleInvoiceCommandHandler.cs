using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Invoices.Commands.CreateSaleInvoice;

/// <summary>
/// Core FEFO (First Expired, First Out) sale handler.
/// Atomic operation: batch deductions + invoice creation + stock movements = single SaveChangesAsync.
/// 
/// Algorithm:
/// 1. Aggregate duplicate ProductIds, validate all products exist and are active
/// 2. For each product: load FEFO-ordered batches, verify sufficient stock
/// 3. Pre-calculate TotalAmount by simulating FEFO deductions (read-only pass)
/// 4. Create Invoice with correct TotalAmount and PaymentStatus
/// 5. Execute FEFO deductions: deduct batches, create InvoiceItems with snapshots, record StockMovements
/// 6. Recalculate AverageCost for all affected products
/// 7. Single SaveChangesAsync — all or nothing
/// </summary>
public class CreateSaleInvoiceCommandHandler : IRequestHandler<CreateSaleInvoiceCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreateSaleInvoiceCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(CreateSaleInvoiceCommand request, CancellationToken ct)
    {
        // ── 1. Aggregate requested quantities per product (handles duplicate ProductIds) ──
        var aggregatedItems = request.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, TotalQuantity = g.Sum(x => x.Quantity) })
            .ToList();

        // ── 2. Load all products and validate ──
        var products = new Dictionary<Guid, Product>();
        foreach (var item in aggregatedItems)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId, ct);
            if (product is null)
                return Result<Guid>.Failure(_localizer[MessageKeys.ProductNotFound]);

            products[item.ProductId] = product;
        }

        // ── 2b. Validate customer if provided ──
        Domain.Entities.Customer? customer = null;
        if (request.CustomerId.HasValue)
        {
            customer = await _unitOfWork.Customers.GetByIdAsync(request.CustomerId.Value, ct);
            if (customer is null)
                return Result<Guid>.Failure(_localizer[MessageKeys.CustomerNotFound]);
        }

        // ── 3. Load FEFO batches and validate stock for all products ──
        var batchesByProduct = new Dictionary<Guid, List<Batch>>();
        foreach (var item in aggregatedItems)
        {
            var batches = await _unitOfWork.Batches
                .GetAvailableBatchesByProductIdAsync(item.ProductId, ct);

            var totalAvailable = batches.Sum(b => b.Quantity);
            if (totalAvailable < item.TotalQuantity)
            {
                var product = products[item.ProductId];
                return Result<Guid>.Failure(string.Format(
                    _localizer[MessageKeys.InsufficientStock],
                    product.NameAr,
                    totalAvailable,
                    item.TotalQuantity));
            }

            batchesByProduct[item.ProductId] = batches;
        }

        // ── 4. Pre-calculate TotalAmount (simulate FEFO to determine line totals) ──
        var totalAmount = 0m;
        foreach (var item in aggregatedItems)
        {
            var product = products[item.ProductId];
            totalAmount += item.TotalQuantity * product.SellingPrice;
        }

        // ── 5. Generate invoice number and create Invoice ──
        var invoiceNumber = await _unitOfWork.Invoices.GenerateNextInvoiceNumberAsync(ct);
        var invoice = Invoice.Create(invoiceNumber, totalAmount, request.AmountPaid, request.CustomerId);
        await _unitOfWork.Invoices.AddAsync(invoice, ct);

        // ── 6. FEFO Deductions — create InvoiceItems + StockMovements ──
        foreach (var item in aggregatedItems)
        {
            var product = products[item.ProductId];
            var batches = batchesByProduct[item.ProductId];
            var remainingQuantity = item.TotalQuantity;

            foreach (var batch in batches)
            {
                if (remainingQuantity <= 0)
                    break;

                var deductAmount = Math.Min(batch.Quantity, remainingQuantity);

                // Deduct from batch (domain method enforces invariants)
                batch.DeductQuantity(deductAmount);

                // Create InvoiceItem with immutable price/cost snapshots
                var invoiceItem = InvoiceItem.Create(
                    invoiceId: invoice.Id,
                    productId: product.Id,
                    batchId: batch.Id,
                    quantity: deductAmount,
                    unitPriceAtSale: product.SellingPrice,
                    unitCostAtSale: batch.PurchasePrice);

                // Add to DbContext via the invoice's Items collection tracking
                await _unitOfWork.Invoices.AddInvoiceItemAsync(invoiceItem, ct);

                // Record stock movement (Sale type, references this invoice)
                var movement = StockMovement.Create(
                    product.Id,
                    batch.Id,
                    StockMovementType.Sale,
                    deductAmount,
                    referenceId: invoice.Id);

                await _unitOfWork.StockMovements.AddAsync(movement, ct);

                remainingQuantity -= deductAmount;
            }
        }

        // ── 7. Recalculate AverageCost for all affected products ──
        foreach (var productId in aggregatedItems.Select(i => i.ProductId))
        {
            var product = products[productId];
            var updatedBatches = await _unitOfWork.Batches
                .GetAvailableBatchesByProductIdAsync(productId, ct);

            product.RecalculateAverageCost(updatedBatches);
            _unitOfWork.Products.Update(product);
        }

        // ── 8. Update Customer.Balance for credit/partial sales ──
        if (customer is not null && request.AmountPaid < totalAmount)
        {
            var unpaidAmount = totalAmount - request.AmountPaid;
            customer.AdjustBalance(unpaidAmount);
            _unitOfWork.Customers.Update(customer);
        }

        // ── 9. Single atomic SaveChangesAsync ──
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(invoice.Id);
    }
}

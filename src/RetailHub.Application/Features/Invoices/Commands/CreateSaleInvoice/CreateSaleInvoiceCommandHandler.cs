using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Invoices.Commands.CreateSaleInvoice;

/// <summary>
/// Core FEFO (First Expired, First Out) sale handler with multi-unit support.
/// Atomic operation: unit resolution + batch deductions + invoice creation + stock movements = single SaveChangesAsync.
/// 
/// Algorithm:
/// 1. For each item: resolve ProductUnit (explicit UnitId or product's default)
/// 2. Calculate BaseQuantity = Quantity × ConversionFactor for stock validation
/// 3. Aggregate duplicate ProductIds, validate all products exist and are active
/// 4. For each product: load FEFO-ordered batches, verify sufficient stock (in base units)
/// 5. Pre-calculate Subtotal using unit prices
/// 6. Create Invoice with correct Subtotal/discount and PaymentStatus
/// 7. Execute FEFO deductions: deduct BaseQuantity from batches, create InvoiceItems with unit snapshots
/// 8. Recalculate AverageCost for all affected products
/// 9. Single SaveChangesAsync — all or nothing
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
        // ── 1. Resolve units and build enriched item list ──
        var resolvedItems = new List<ResolvedSaleItem>();

        foreach (var item in request.Items)
        {
            ProductUnit? unit;
            if (item.UnitId.HasValue)
            {
                unit = await _unitOfWork.ProductUnits.GetByIdAsync(item.UnitId.Value, ct);
                if (unit is null)
                    return Result<Guid>.Failure("وحدة المنتج غير موجودة.");
                if (unit.ProductId != item.ProductId)
                    return Result<Guid>.Failure("وحدة المنتج لا تنتمي للمنتج المحدد.");
            }
            else
            {
                unit = await _unitOfWork.ProductUnits.GetDefaultUnitByProductIdAsync(item.ProductId, ct);
                if (unit is null)
                    return Result<Guid>.Failure($"لا توجد وحدة افتراضية للمنتج.");
            }

            resolvedItems.Add(new ResolvedSaleItem(
                item.ProductId,
                item.Quantity,
                unit));
        }

        // ── 2. Aggregate requested base quantities per product ──
        var aggregatedItems = resolvedItems
            .GroupBy(i => i.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalBaseQuantity = g.Sum(x => x.Quantity * x.Unit.ConversionFactor),
                Items = g.ToList()
            })
            .ToList();

        // ── 3. Load all products and validate ──
        var products = new Dictionary<Guid, Product>();
        foreach (var item in aggregatedItems)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId, ct);
            if (product is null)
                return Result<Guid>.Failure(_localizer[MessageKeys.ProductNotFound]);

            products[item.ProductId] = product;
        }

        // ── 3b. Validate customer if provided ──
        Domain.Entities.Customer? customer = null;
        if (request.CustomerId.HasValue)
        {
            customer = await _unitOfWork.Customers.GetByIdAsync(request.CustomerId.Value, ct);
            if (customer is null)
                return Result<Guid>.Failure(_localizer[MessageKeys.CustomerNotFound]);
        }

        // ── 4. Load FEFO batches and validate stock (in base units) ──
        var batchesByProduct = new Dictionary<Guid, List<Batch>>();
        foreach (var item in aggregatedItems)
        {
            var batches = await _unitOfWork.Batches
                .GetAvailableBatchesByProductIdAsync(item.ProductId, ct);

            var totalAvailable = batches.Sum(b => b.Quantity);
            if (totalAvailable < item.TotalBaseQuantity)
            {
                var product = products[item.ProductId];
                return Result<Guid>.Failure(string.Format(
                    _localizer[MessageKeys.InsufficientStock],
                    product.NameAr,
                    totalAvailable,
                    item.TotalBaseQuantity));
            }

            batchesByProduct[item.ProductId] = batches;
        }

        // ── 5. Pre-calculate Subtotal (sum of unit prices × quantities) ──
        var subtotal = 0m;
        foreach (var resolved in resolvedItems)
        {
            subtotal += resolved.Quantity * resolved.Unit.SalePrice;
        }
        subtotal = Math.Round(subtotal, 2, MidpointRounding.AwayFromZero);

        // ── 6. Generate invoice number and create Invoice with discount ──
        var invoiceNumber = await _unitOfWork.Invoices.GenerateNextInvoiceNumberAsync(ct);
        var invoice = Invoice.Create(
            invoiceNumber,
            subtotal,
            request.DiscountPercent,
            request.AmountPaid,
            request.CustomerId,
            request.DiscountReason,
            request.DiscountedByUserId);
        await _unitOfWork.Invoices.AddAsync(invoice, ct);

        // ── 7. FEFO Deductions — create InvoiceItems + StockMovements ──
        foreach (var agg in aggregatedItems)
        {
            var batches = batchesByProduct[agg.ProductId];

            // Process each resolved item (preserving unit info per cart row)
            foreach (var resolved in agg.Items)
            {
                var baseQtyToDeduct = resolved.Quantity * resolved.Unit.ConversionFactor;
                var remainingBaseQty = baseQtyToDeduct;
                Guid? primaryBatchId = null;
                decimal unitCostAtSale = 0m;

                foreach (var batch in batches)
                {
                    if (remainingBaseQty <= 0)
                        break;

                    if (batch.Quantity <= 0)
                        continue;

                    var deductAmount = Math.Min(batch.Quantity, remainingBaseQty);

                    // Deduct from batch (domain method enforces invariants)
                    batch.DeductQuantity(deductAmount);
                    if (primaryBatchId is null)
                    {
                        primaryBatchId = batch.Id;
                        unitCostAtSale = batch.PurchasePrice;
                    }

                    // Record stock movement (Sale type, in base units)
                    var movement = StockMovement.Create(
                        resolved.ProductId,
                        batch.Id,
                        StockMovementType.Sale,
                        deductAmount,
                        referenceId: invoice.Id);

                    await _unitOfWork.StockMovements.AddAsync(movement, ct);

                    remainingBaseQty -= deductAmount;
                }

                // Create InvoiceItem with immutable unit/price snapshots
                var invoiceItem = InvoiceItem.Create(
                    invoiceId: invoice.Id,
                    productId: resolved.ProductId,
                    batchId: primaryBatchId ?? batches.First().Id,
                    quantity: resolved.Quantity,
                    unitPriceAtSale: resolved.Unit.SalePrice,
                    unitCostAtSale: unitCostAtSale > 0 ? unitCostAtSale : batches.First().PurchasePrice,
                    discountPercentage: request.DiscountPercent,
                    unitId: resolved.Unit.Id,
                    unitName: resolved.Unit.Name,
                    conversionFactor: resolved.Unit.ConversionFactor);

                await _unitOfWork.Invoices.AddInvoiceItemAsync(invoiceItem, ct);
            }
        }

        // ── 8. Recalculate AverageCost for all affected products ──
        foreach (var productId in aggregatedItems.Select(i => i.ProductId))
        {
            var product = products[productId];
            var updatedBatches = await _unitOfWork.Batches
                .GetAvailableBatchesByProductIdAsync(productId, ct);

            product.RecalculateAverageCost(updatedBatches);
            _unitOfWork.Products.Update(product);
        }

        // ── 9. Update Customer.Balance for credit/partial sales ──
        if (customer is not null && request.AmountPaid < invoice.TotalAmount)
        {
            var unpaidAmount = invoice.TotalAmount - request.AmountPaid;
            customer.AdjustBalance(unpaidAmount);
            _unitOfWork.Customers.Update(customer);
        }

        // ── 9b. Record cash inflow in CashDrawer ──
        if (request.AmountPaid > 0)
        {
            var cashTransaction = CashDrawerTransaction.Create(
                CashDrawerTransactionType.Sale,
                request.AmountPaid,
                referenceId: invoice.Id,
                notes: $"فاتورة بيع رقم {invoice.InvoiceNumber}");

            await _unitOfWork.CashDrawerTransactions.AddAsync(cashTransaction, ct);
        }

        // ── 10. Single atomic SaveChangesAsync ──
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(invoice.Id);
    }

    /// <summary>
    /// Internal record to hold resolved unit info alongside the original request data.
    /// </summary>
    private record ResolvedSaleItem(Guid ProductId, int Quantity, ProductUnit Unit);
}

using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Purchases.Commands.CreatePurchaseInvoice;

/// <summary>
/// Creates a purchase invoice and for each item:
/// 1. Validates supplier and all products exist
/// 2. Creates a new Batch per item (with WarehouseId from default warehouse)
/// 3. Creates StockMovement(Purchase) per item
/// 4. Recalculates Product.AverageCost for all affected products
/// 5. Single SaveChangesAsync — all or nothing
/// </summary>
public class CreatePurchaseInvoiceCommandHandler
    : IRequestHandler<CreatePurchaseInvoiceCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreatePurchaseInvoiceCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(CreatePurchaseInvoiceCommand request, CancellationToken ct)
    {
        // ── 1. Validate supplier ──
        if (!await _unitOfWork.Suppliers.ExistsAsync(request.SupplierId, ct))
            return Result<Guid>.Failure(_localizer[MessageKeys.SupplierNotFound]);

        // ── 2. Load default warehouse ──
        var warehouse = await _unitOfWork.Warehouses.GetDefaultAsync(ct);
        if (warehouse is null)
            return Result<Guid>.Failure(_localizer[MessageKeys.DefaultWarehouseNotFound]);

        // ── 3. Validate all products exist ──
        var products = new Dictionary<Guid, Product>();
        foreach (var item in request.Items)
        {
            if (!products.ContainsKey(item.ProductId))
            {
                var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId, ct);
                if (product is null)
                    return Result<Guid>.Failure(_localizer[MessageKeys.ProductNotFound]);
                products[item.ProductId] = product;
            }
        }

        // ── 4. Calculate total and create PurchaseInvoice ──
        var totalAmount = request.Items.Sum(i => i.Quantity * i.UnitCost);
        var invoiceNumber = await _unitOfWork.PurchaseInvoices.GenerateNextPurchaseNumberAsync(ct);

        var purchaseInvoice = PurchaseInvoice.Create(
            request.SupplierId,
            invoiceNumber,
            totalAmount,
            request.PurchaseDate,
            request.Notes);

        await _unitOfWork.PurchaseInvoices.AddAsync(purchaseInvoice, ct);

        // ── 5. For each item: create Batch + PurchaseInvoiceItem + StockMovement ──
        var affectedProductIds = new HashSet<Guid>();

        foreach (var item in request.Items)
        {
            // Create new Batch
            var batch = Batch.Create(
                item.ProductId,
                warehouse.Id,
                item.UnitCost,
                item.Quantity,
                item.ExpiryDate,
                request.SupplierId);

            await _unitOfWork.Batches.AddAsync(batch, ct);

            // Create PurchaseInvoiceItem
            var purchaseItem = PurchaseInvoiceItem.Create(
                purchaseInvoice.Id,
                item.ProductId,
                item.Quantity,
                item.UnitCost,
                item.ExpiryDate,
                batch.Id);

            await _unitOfWork.PurchaseInvoices.AddItemAsync(purchaseItem, ct);

            // Create StockMovement (Purchase type)
            var movement = StockMovement.Create(
                item.ProductId,
                batch.Id,
                StockMovementType.Purchase,
                item.Quantity,
                referenceId: purchaseInvoice.Id);

            await _unitOfWork.StockMovements.AddAsync(movement, ct);

            affectedProductIds.Add(item.ProductId);
        }

        // ── 6. Recalculate AverageCost for all affected products ──
        foreach (var productId in affectedProductIds)
        {
            var product = products[productId];
            var updatedBatches = await _unitOfWork.Batches
                .GetAvailableBatchesByProductIdAsync(productId, ct);

            product.RecalculateAverageCost(updatedBatches);
            _unitOfWork.Products.Update(product);
        }

        // ── 7. Atomic save ──
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(purchaseInvoice.Id);
    }
}

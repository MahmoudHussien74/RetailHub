namespace RetailHub.Application.Features.Batches.DTOs;

/// <summary>
/// Clean HTTP Request model for adding a batch.
/// ProductId is passed via URL route, not body.
/// </summary>
public record AddBatchRequest(
    Guid WarehouseId,
    decimal PurchasePrice,
    int Quantity,
    DateTime ExpiryDate,
    Guid? SupplierId = null);

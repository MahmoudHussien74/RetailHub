namespace RetailHub.Application.Features.Purchases.DTOs;

/// <summary>
/// Request body DTO for creating a purchase invoice.
/// </summary>
public record CreatePurchaseRequest(
    Guid SupplierId,
    DateTime PurchaseDate,
    string? Notes,
    List<PurchaseItemRequest> Items);

/// <summary>
/// Nested DTO representing a single item in the purchase request.
/// </summary>
public record PurchaseItemRequest(
    Guid ProductId,
    int Quantity,
    decimal UnitCost,
    DateTime ExpiryDate);

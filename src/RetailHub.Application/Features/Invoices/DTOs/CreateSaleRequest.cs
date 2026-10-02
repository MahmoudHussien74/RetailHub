namespace RetailHub.Application.Features.Invoices.DTOs;

/// <summary>
/// Request body DTO for creating a sale invoice.
/// Controller maps this to CreateSaleInvoiceCommand.
/// </summary>
public record CreateSaleRequest(
    List<SaleItemRequest> Items,
    decimal AmountPaid,
    Guid? CustomerId = null,
    decimal DiscountPercent = 0m,
    string? DiscountReason = null,
    Guid? DiscountedByUserId = null,
    bool IsManagerApproved = false);

/// <summary>
/// Nested DTO representing a single item in the sale request.
/// UnitId is optional — if not provided, the product's default unit is used.
/// </summary>
public record SaleItemRequest(Guid ProductId, int Quantity, Guid? UnitId = null);

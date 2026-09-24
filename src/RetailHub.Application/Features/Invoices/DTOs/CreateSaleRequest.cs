namespace RetailHub.Application.Features.Invoices.DTOs;

/// <summary>
/// Request body DTO for creating a sale invoice.
/// Controller maps this to CreateSaleInvoiceCommand.
/// </summary>
public record CreateSaleRequest(
    List<SaleItemRequest> Items,
    decimal AmountPaid,
    Guid? CustomerId = null);

/// <summary>
/// Nested DTO representing a single item in the sale request.
/// </summary>
public record SaleItemRequest(Guid ProductId, int Quantity);

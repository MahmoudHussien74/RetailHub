namespace RetailHub.Application.Features.Returns.DTOs;

/// <summary>
/// Request body DTO for creating a return invoice.
/// </summary>
public record CreateReturnRequest(
    Guid OriginalInvoiceId,
    List<ReturnItemRequest> Items);

/// <summary>
/// Nested DTO representing a single item in the return request.
/// InvoiceItemId references the specific line item in the original invoice.
/// </summary>
public record ReturnItemRequest(
    Guid InvoiceItemId,
    int Quantity,
    bool IsDamaged);

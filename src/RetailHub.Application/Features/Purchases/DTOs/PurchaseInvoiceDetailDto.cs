namespace RetailHub.Application.Features.Purchases.DTOs;

public class PurchaseInvoiceDetailDto
{
    public Guid Id { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public Guid SupplierId { get; init; }
    public string SupplierName { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public DateTime PurchaseDate { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<PurchaseInvoiceItemDto> Items { get; init; } = [];
}

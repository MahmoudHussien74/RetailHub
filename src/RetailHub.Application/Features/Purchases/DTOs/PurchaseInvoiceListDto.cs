namespace RetailHub.Application.Features.Purchases.DTOs;

public class PurchaseInvoiceListDto
{
    public Guid Id { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public Guid SupplierId { get; init; }
    public string SupplierName { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public int ItemCount { get; init; }
    public DateTime PurchaseDate { get; init; }
}

namespace RetailHub.Application.Features.Purchases.DTOs;

public class PurchaseInvoiceItemDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductNameAr { get; init; } = string.Empty;
    public string? ProductNameEn { get; init; }
    public int Quantity { get; init; }
    public decimal UnitCost { get; init; }
    public decimal LineTotal { get; init; }
    public DateTime ExpiryDate { get; init; }
    public Guid BatchId { get; init; }
}

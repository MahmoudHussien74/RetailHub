namespace RetailHub.Application.Features.Returns.DTOs;

public class ReturnInvoiceItemDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductNameAr { get; init; } = string.Empty;
    public string? ProductNameEn { get; init; }
    public Guid BatchId { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPriceAtSale { get; init; }
    public decimal LineTotal { get; init; }
    public bool IsDamaged { get; init; }
}

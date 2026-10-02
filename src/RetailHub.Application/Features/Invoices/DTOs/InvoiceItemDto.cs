namespace RetailHub.Application.Features.Invoices.DTOs;

public class InvoiceItemDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductNameAr { get; init; } = string.Empty;
    public string? ProductNameEn { get; init; }
    public Guid BatchId { get; init; }
    public int Quantity { get; init; }
    public Guid? UnitId { get; init; }
    public string UnitName { get; init; } = string.Empty;
    public int ConversionFactor { get; init; }
    public int BaseQuantity { get; init; }
    public decimal UnitPriceAtSale { get; init; }
    public decimal UnitCostAtSale { get; init; }
    public decimal DiscountPercentage { get; init; }
    public decimal DiscountAmount { get; init; }
    public decimal LineTotal { get; init; }
    public int ReturnedQuantity { get; init; }
    public int RemainingReturnableQuantity => Math.Max(0, Quantity - ReturnedQuantity);
}

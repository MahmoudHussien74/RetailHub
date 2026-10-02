namespace RetailHub.Application.Features.Invoices.DTOs;

public class InvoiceListDto
{
    public Guid Id { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public string PaymentStatus { get; init; } = string.Empty;
    public decimal Subtotal { get; init; }
    public decimal DiscountPercent { get; init; }
    public decimal DiscountAmount { get; init; }
    public decimal TotalAmount { get; init; }
    public decimal Total => TotalAmount;
    public decimal AmountPaid { get; init; }
    public int ItemCount { get; init; }
    public bool IsVoided { get; init; }
    public bool HasReturns { get; init; }
    public decimal TotalRefunded { get; init; }
    public bool IsFullyReturned { get; init; }
    public DateTime CreatedAt { get; init; }
}

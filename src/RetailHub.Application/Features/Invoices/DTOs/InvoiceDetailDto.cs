namespace RetailHub.Application.Features.Invoices.DTOs;

public class InvoiceDetailDto
{
    public Guid Id { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public Guid? CustomerId { get; init; }
    public string PaymentStatus { get; init; } = string.Empty;
    public decimal Subtotal { get; init; }
    public decimal DiscountPercent { get; init; }
    public decimal DiscountAmount { get; init; }
    public decimal TotalAmount { get; init; }
    public decimal Total => TotalAmount;
    public decimal AmountPaid { get; init; }
    public string? DiscountReason { get; init; }
    public Guid? DiscountedByUserId { get; init; }
    public bool IsVoided { get; init; }
    public bool HasReturns { get; init; }
    public decimal TotalRefunded { get; init; }
    public bool IsFullyReturned { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<InvoiceItemDto> Items { get; init; } = [];
}

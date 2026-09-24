namespace RetailHub.Application.Features.Invoices.DTOs;

public class InvoiceListDto
{
    public Guid Id { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public string PaymentStatus { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public decimal AmountPaid { get; init; }
    public int ItemCount { get; init; }
    public bool IsVoided { get; init; }
    public DateTime CreatedAt { get; init; }
}

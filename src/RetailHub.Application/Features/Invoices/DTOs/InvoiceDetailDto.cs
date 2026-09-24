namespace RetailHub.Application.Features.Invoices.DTOs;

public class InvoiceDetailDto
{
    public Guid Id { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public Guid? CustomerId { get; init; }
    public string PaymentStatus { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public decimal AmountPaid { get; init; }
    public bool IsVoided { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<InvoiceItemDto> Items { get; init; } = [];
}

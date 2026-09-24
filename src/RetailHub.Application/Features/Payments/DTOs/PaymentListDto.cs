namespace RetailHub.Application.Features.Payments.DTOs;

public class PaymentListDto
{
    public Guid Id { get; init; }
    public Guid CustomerId { get; init; }
    public Guid? InvoiceId { get; init; }
    public string? InvoiceNumber { get; init; }
    public decimal Amount { get; init; }
    public DateTime PaymentDate { get; init; }
    public string? Notes { get; init; }
}

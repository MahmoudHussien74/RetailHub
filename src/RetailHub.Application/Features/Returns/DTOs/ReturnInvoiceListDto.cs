namespace RetailHub.Application.Features.Returns.DTOs;

public class ReturnInvoiceListDto
{
    public Guid Id { get; init; }
    public Guid OriginalInvoiceId { get; init; }
    public string OriginalInvoiceNumber { get; init; } = string.Empty;
    public Guid? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public decimal TotalRefundAmount { get; init; }
    public int ItemCount { get; init; }
    public DateTime ReturnDate { get; init; }
}

namespace RetailHub.Application.Features.Invoices.DTOs;

public class DiscountReportDto
{
    public Guid InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? DiscountReason { get; set; }
    public Guid? DiscountedByUserId { get; set; }
    public string DiscountedByUserName { get; set; } = string.Empty;
}

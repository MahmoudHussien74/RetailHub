using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class ReturnInvoice : AuditableEntity
{
    public Guid OriginalInvoiceId { get; private set; }
    public Guid? CustomerId { get; private set; }
    public decimal TotalRefundAmount { get; private set; }
    public DateTime ReturnDate { get; private set; }

    // Navigation
    public Invoice OriginalInvoice { get; private set; } = null!;
    public Customer? Customer { get; private set; }
    public ICollection<ReturnInvoiceItem> Items { get; private set; } = [];

    private ReturnInvoice() { } // EF Core

    public static ReturnInvoice Create(
        Guid originalInvoiceId,
        decimal totalRefundAmount,
        Guid? customerId = null)
    {
        return new ReturnInvoice
        {
            OriginalInvoiceId = originalInvoiceId,
            CustomerId = customerId,
            TotalRefundAmount = totalRefundAmount,
            ReturnDate = DateTime.UtcNow
        };
    }
}

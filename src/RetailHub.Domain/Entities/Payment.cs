using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

/// <summary>
/// Independent payment record tracking customer installment payments.
/// Optionally linked to a specific Invoice for payment allocation.
/// When recorded, Customer.Balance is adjusted (decreased) accordingly.
/// </summary>
public class Payment : AuditableEntity
{
    public Guid CustomerId { get; private set; }
    public Guid? InvoiceId { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime PaymentDate { get; private set; }
    public string? Notes { get; private set; }

    // Navigation
    public Customer Customer { get; private set; } = null!;
    public Invoice? Invoice { get; private set; }

    private Payment() { } // EF Core

    public static Payment Create(
        Guid customerId,
        decimal amount,
        Guid? invoiceId = null,
        string? notes = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Payment amount must be positive.", nameof(amount));

        return new Payment
        {
            CustomerId = customerId,
            Amount = amount,
            InvoiceId = invoiceId,
            PaymentDate = DateTime.UtcNow,
            Notes = notes
        };
    }
}

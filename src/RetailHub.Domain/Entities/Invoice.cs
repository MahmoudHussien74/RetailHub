using RetailHub.Domain.Common;
using RetailHub.Domain.Enums;

namespace RetailHub.Domain.Entities;

public class Invoice : AuditableEntity
{
    public string InvoiceNumber { get; private set; } = string.Empty;
    public Guid? CustomerId { get; private set; }
    public PaymentStatus PaymentStatus { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal AmountPaid { get; private set; }
    public bool IsVoided { get; private set; }

    // Navigation
    public ICollection<InvoiceItem> Items { get; private set; } = [];

    private Invoice() { } // EF Core

    /// <summary>
    /// Creates a new sale invoice. PaymentStatus is automatically determined
    /// from AmountPaid vs TotalAmount comparison.
    /// </summary>
    public static Invoice Create(
        string invoiceNumber,
        decimal totalAmount,
        decimal amountPaid,
        Guid? customerId = null)
    {
        if (totalAmount <= 0)
            throw new ArgumentException("Total amount must be positive.", nameof(totalAmount));

        if (amountPaid < 0)
            throw new ArgumentException("Amount paid cannot be negative.", nameof(amountPaid));

        return new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = customerId,
            TotalAmount = totalAmount,
            AmountPaid = amountPaid,
            PaymentStatus = DeterminePaymentStatus(totalAmount, amountPaid),
            IsVoided = false
        };
    }

    /// <summary>
    /// Marks this invoice as voided (soft-delete for financial records).
    /// No hard delete — uses reversal entries for stock.
    /// </summary>
    public void Void()
    {
        if (IsVoided)
            throw new InvalidOperationException("Invoice is already voided.");

        IsVoided = true;
    }

    /// <summary>
    /// Updates the amount paid and recalculates payment status.
    /// Used for partial payment scenarios.
    /// </summary>
    public void UpdatePayment(decimal newAmountPaid)
    {
        if (newAmountPaid < 0)
            throw new ArgumentException("Amount paid cannot be negative.", nameof(newAmountPaid));

        AmountPaid = newAmountPaid;
        PaymentStatus = DeterminePaymentStatus(TotalAmount, newAmountPaid);
    }

    private static PaymentStatus DeterminePaymentStatus(decimal totalAmount, decimal amountPaid)
    {
        if (amountPaid >= totalAmount)
            return Enums.PaymentStatus.Paid;

        if (amountPaid > 0)
            return Enums.PaymentStatus.Partial;

        return Enums.PaymentStatus.Credit;
    }
}

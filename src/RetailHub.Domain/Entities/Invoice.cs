using RetailHub.Domain.Common;
using RetailHub.Domain.Enums;

namespace RetailHub.Domain.Entities;

public class Invoice : AuditableEntity
{
    public string InvoiceNumber { get; private set; } = string.Empty;
    public Guid? CustomerId { get; private set; }
    public PaymentStatus PaymentStatus { get; private set; }
    public decimal Subtotal { get; private set; }
    public decimal DiscountPercent { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal Total => TotalAmount;
    public decimal AmountPaid { get; private set; }
    public string? DiscountReason { get; private set; }
    public Guid? DiscountedByUserId { get; private set; }
    public bool IsVoided { get; private set; }

    // Navigation
    public Customer? Customer { get; private set; }
    public ICollection<InvoiceItem> Items { get; private set; } = [];
    public ICollection<ReturnInvoice> ReturnInvoices { get; private set; } = [];
    public ICollection<Payment> Payments { get; private set; } = [];

    private Invoice() { } // EF Core

    /// <summary>
    /// Creates a new sale invoice with Subtotal, Discount calculation, and Net TotalAmount.
    /// PaymentStatus is automatically determined from AmountPaid vs TotalAmount comparison.
    /// </summary>
    public static Invoice Create(
        string invoiceNumber,
        decimal subtotal,
        decimal discountPercent,
        decimal amountPaid,
        Guid? customerId = null,
        string? discountReason = null,
        Guid? discountedByUserId = null)
    {
        if (subtotal < 0)
            throw new ArgumentException("Subtotal cannot be negative.", nameof(subtotal));

        if (discountPercent < 0 || discountPercent > 100)
            throw new ArgumentException("Discount percent must be between 0 and 100.", nameof(discountPercent));

        if (amountPaid < 0)
            throw new ArgumentException("Amount paid cannot be negative.", nameof(amountPaid));

        var roundedSubtotal = Math.Round(subtotal, 2, MidpointRounding.AwayFromZero);
        var roundedPercent = Math.Round(discountPercent, 2, MidpointRounding.AwayFromZero);
        var discountAmount = Math.Round(roundedSubtotal * (roundedPercent / 100m), 2, MidpointRounding.AwayFromZero);
        var total = Math.Max(0m, Math.Round(roundedSubtotal - discountAmount, 2, MidpointRounding.AwayFromZero));

        return new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = customerId,
            Subtotal = roundedSubtotal,
            DiscountPercent = roundedPercent,
            DiscountAmount = discountAmount,
            TotalAmount = total,
            AmountPaid = amountPaid,
            PaymentStatus = DeterminePaymentStatus(total, amountPaid),
            DiscountReason = discountReason,
            DiscountedByUserId = discountedByUserId,
            IsVoided = false
        };
    }

    /// <summary>
    /// Backward-compatible overload for invoices without discounts.
    /// </summary>
    public static Invoice Create(
        string invoiceNumber,
        decimal totalAmount,
        decimal amountPaid,
        Guid? customerId = null)
    {
        return Create(invoiceNumber, totalAmount, 0m, amountPaid, customerId);
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
        if (totalAmount == 0m || amountPaid >= totalAmount)
            return Enums.PaymentStatus.Paid;

        if (amountPaid > 0)
            return Enums.PaymentStatus.Partial;

        return Enums.PaymentStatus.Credit;
    }
}

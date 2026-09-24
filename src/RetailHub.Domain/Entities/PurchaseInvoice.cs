using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class PurchaseInvoice : AuditableEntity
{
    public Guid SupplierId { get; private set; }
    public string InvoiceNumber { get; private set; } = string.Empty;
    public decimal TotalAmount { get; private set; }
    public DateTime PurchaseDate { get; private set; }
    public string? Notes { get; private set; }

    // Navigation
    public Supplier Supplier { get; private set; } = null!;
    public ICollection<PurchaseInvoiceItem> Items { get; private set; } = [];

    private PurchaseInvoice() { } // EF Core

    public static PurchaseInvoice Create(
        Guid supplierId,
        string invoiceNumber,
        decimal totalAmount,
        DateTime purchaseDate,
        string? notes = null)
    {
        if (totalAmount < 0)
            throw new ArgumentException("Total amount cannot be negative.", nameof(totalAmount));

        return new PurchaseInvoice
        {
            SupplierId = supplierId,
            InvoiceNumber = invoiceNumber,
            TotalAmount = totalAmount,
            PurchaseDate = purchaseDate,
            Notes = notes
        };
    }
}

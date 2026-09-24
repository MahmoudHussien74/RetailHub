using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class PurchaseInvoiceItem : AuditableEntity
{
    public Guid PurchaseInvoiceId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitCost { get; private set; }
    public DateTime ExpiryDate { get; private set; }

    /// <summary>
    /// Set after the corresponding Batch is created during purchase processing.
    /// </summary>
    public Guid BatchId { get; private set; }

    /// <summary>
    /// Computed line total: Quantity × UnitCost.
    /// </summary>
    public decimal LineTotal => Quantity * UnitCost;

    // Navigation
    public PurchaseInvoice PurchaseInvoice { get; private set; } = null!;
    public Product Product { get; private set; } = null!;
    public Batch Batch { get; private set; } = null!;

    private PurchaseInvoiceItem() { } // EF Core

    public static PurchaseInvoiceItem Create(
        Guid purchaseInvoiceId,
        Guid productId,
        int quantity,
        decimal unitCost,
        DateTime expiryDate,
        Guid batchId)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be positive.", nameof(quantity));

        if (unitCost < 0)
            throw new ArgumentException("Unit cost cannot be negative.", nameof(unitCost));

        return new PurchaseInvoiceItem
        {
            PurchaseInvoiceId = purchaseInvoiceId,
            ProductId = productId,
            Quantity = quantity,
            UnitCost = unitCost,
            ExpiryDate = expiryDate,
            BatchId = batchId
        };
    }
}

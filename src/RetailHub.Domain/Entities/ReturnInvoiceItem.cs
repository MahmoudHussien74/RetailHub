using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class ReturnInvoiceItem : AuditableEntity
{
    public Guid ReturnInvoiceId { get; private set; }
    public Guid InvoiceItemId { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid BatchId { get; private set; }
    public int Quantity { get; private set; }

    /// <summary>
    /// Snapshot from original InvoiceItem — immutable.
    /// </summary>
    public decimal UnitPriceAtSale { get; private set; }

    /// <summary>
    /// Snapshot of discount percentage from original InvoiceItem.
    /// </summary>
    public decimal DiscountPercentage { get; private set; }

    /// <summary>
    /// If true, product is damaged and will NOT be returned to sellable stock.
    /// Recorded as StockMovement(Damage) instead of StockMovement(Return).
    /// </summary>
    public bool IsDamaged { get; private set; }

    /// <summary>
    /// Net unit price after discount: UnitPriceAtSale × (1 - DiscountPercentage / 100).
    /// This is the actual refund amount per unit.
    /// </summary>
    public decimal NetUnitPrice => UnitPriceAtSale * (1m - (DiscountPercentage / 100m));

    /// <summary>
    /// Computed line total: Quantity × NetUnitPrice (refund at discounted price).
    /// </summary>
    public decimal LineTotal => Quantity * NetUnitPrice;

    // Navigation
    public ReturnInvoice ReturnInvoice { get; private set; } = null!;
    public InvoiceItem InvoiceItem { get; private set; } = null!;
    public Product Product { get; private set; } = null!;
    public Batch Batch { get; private set; } = null!;

    private ReturnInvoiceItem() { } // EF Core

    public static ReturnInvoiceItem Create(
        Guid returnInvoiceId,
        Guid invoiceItemId,
        Guid productId,
        Guid batchId,
        int quantity,
        decimal unitPriceAtSale,
        decimal discountPercentage,
        bool isDamaged)
    {
        if (quantity <= 0)
            throw new ArgumentException("Return quantity must be positive.", nameof(quantity));

        return new ReturnInvoiceItem
        {
            ReturnInvoiceId = returnInvoiceId,
            InvoiceItemId = invoiceItemId,
            ProductId = productId,
            BatchId = batchId,
            Quantity = quantity,
            UnitPriceAtSale = unitPriceAtSale,
            DiscountPercentage = discountPercentage,
            IsDamaged = isDamaged
        };
    }
}

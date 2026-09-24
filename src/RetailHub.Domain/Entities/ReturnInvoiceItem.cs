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
    /// If true, product is damaged and will NOT be returned to sellable stock.
    /// Recorded as StockMovement(Damage) instead of StockMovement(Return).
    /// </summary>
    public bool IsDamaged { get; private set; }

    /// <summary>
    /// Computed line total: Quantity × UnitPriceAtSale.
    /// </summary>
    public decimal LineTotal => Quantity * UnitPriceAtSale;

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
            IsDamaged = isDamaged
        };
    }
}

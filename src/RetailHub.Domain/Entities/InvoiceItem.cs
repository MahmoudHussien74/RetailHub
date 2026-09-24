using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class InvoiceItem : AuditableEntity
{
    public Guid InvoiceId { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid BatchId { get; private set; }
    public int Quantity { get; private set; }

    /// <summary>
    /// Snapshot of Product.SellingPrice at sale time — immutable forever.
    /// </summary>
    public decimal UnitPriceAtSale { get; private set; }

    /// <summary>
    /// Snapshot of Batch.PurchasePrice at sale time — immutable forever.
    /// </summary>
    public decimal UnitCostAtSale { get; private set; }

    /// <summary>
    /// Computed line total: Quantity × UnitPriceAtSale.
    /// </summary>
    public decimal LineTotal => Quantity * UnitPriceAtSale;

    // Navigation
    public Invoice Invoice { get; private set; } = null!;
    public Product Product { get; private set; } = null!;
    public Batch Batch { get; private set; } = null!;
    public ICollection<ReturnInvoiceItem> ReturnItems { get; private set; } = [];

    private InvoiceItem() { } // EF Core

    public static InvoiceItem Create(
        Guid invoiceId,
        Guid productId,
        Guid batchId,
        int quantity,
        decimal unitPriceAtSale,
        decimal unitCostAtSale)
    {
        return new InvoiceItem
        {
            InvoiceId = invoiceId,
            ProductId = productId,
            BatchId = batchId,
            Quantity = quantity,
            UnitPriceAtSale = unitPriceAtSale,
            UnitCostAtSale = unitCostAtSale
        };
    }
}

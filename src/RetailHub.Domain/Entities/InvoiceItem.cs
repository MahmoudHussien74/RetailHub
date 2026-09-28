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
    /// Discount percentage applied to this item (0–100). E.g. 10 = 10% off.
    /// Default is 0 (no discount).
    /// </summary>
    public decimal DiscountPercentage { get; private set; }

    /// <summary>
    /// Net unit price after applying discount: UnitPriceAtSale × (1 - DiscountPercentage / 100).
    /// This is the actual price the customer paid per unit.
    /// </summary>
    public decimal NetUnitPrice => UnitPriceAtSale * (1m - (DiscountPercentage / 100m));

    /// <summary>
    /// Computed line total: Quantity × NetUnitPrice (price after discount).
    /// </summary>
    public decimal LineTotal => Quantity * NetUnitPrice;

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
        decimal unitCostAtSale,
        decimal discountPercentage = 0m)
    {
        if (discountPercentage < 0 || discountPercentage > 100)
            throw new ArgumentException("Discount percentage must be between 0 and 100.", nameof(discountPercentage));

        return new InvoiceItem
        {
            InvoiceId = invoiceId,
            ProductId = productId,
            BatchId = batchId,
            Quantity = quantity,
            UnitPriceAtSale = unitPriceAtSale,
            UnitCostAtSale = unitCostAtSale,
            DiscountPercentage = discountPercentage
        };
    }
}

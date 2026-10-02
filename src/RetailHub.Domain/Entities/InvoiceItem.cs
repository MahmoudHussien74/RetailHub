using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class InvoiceItem : AuditableEntity
{
    public Guid InvoiceId { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid BatchId { get; private set; }

    /// <summary>
    /// Quantity in the selected unit (e.g. 2 strips).
    /// </summary>
    public int Quantity { get; private set; }

    /// <summary>
    /// Reference to the ProductUnit used for this sale. Nullable for backward compat.
    /// </summary>
    public Guid? UnitId { get; private set; }

    /// <summary>
    /// Snapshot of unit name at sale time (e.g. "شريط"). Immutable.
    /// </summary>
    public string UnitName { get; private set; } = string.Empty;

    /// <summary>
    /// Snapshot of ConversionFactor at sale time. Immutable.
    /// E.g. strip=10 means 1 strip = 10 base units (tablets).
    /// </summary>
    public int ConversionFactor { get; private set; } = 1;

    /// <summary>
    /// Total quantity in base units = Quantity × ConversionFactor.
    /// This is what gets deducted from batch stock.
    /// </summary>
    public int BaseQuantity { get; private set; }

    /// <summary>
    /// Snapshot of Product.SellingPrice (or ProductUnit.SalePrice) at sale time — immutable forever.
    /// This is the price per selected unit.
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
    public decimal DiscountAmount { get; private set; }

    /// <summary>
    /// Net unit price after applying discount: UnitPriceAtSale × (1 - DiscountPercentage / 100).
    /// This is the actual price the customer paid per unit.
    /// </summary>
    public decimal NetUnitPrice => UnitPriceAtSale * (1m - (DiscountPercentage / 100m));

    /// <summary>
    /// Computed line total: Quantity × NetUnitPrice (price after discount).
    /// </summary>
    public decimal LineTotal => Math.Round(Quantity * NetUnitPrice, 2, MidpointRounding.AwayFromZero);

    // Navigation
    public Invoice Invoice { get; private set; } = null!;
    public Product Product { get; private set; } = null!;
    public Batch Batch { get; private set; } = null!;
    public ProductUnit? Unit { get; private set; }
    public ICollection<ReturnInvoiceItem> ReturnItems { get; private set; } = [];

    private InvoiceItem() { } // EF Core

    public static InvoiceItem Create(
        Guid invoiceId,
        Guid productId,
        Guid batchId,
        int quantity,
        decimal unitPriceAtSale,
        decimal unitCostAtSale,
        decimal discountPercentage = 0m,
        Guid? unitId = null,
        string unitName = "وحدة",
        int conversionFactor = 1)
    {
        if (discountPercentage < 0 || discountPercentage > 100)
            throw new ArgumentException("Discount percentage must be between 0 and 100.", nameof(discountPercentage));

        if (conversionFactor <= 0)
            throw new ArgumentException("Conversion factor must be positive.", nameof(conversionFactor));

        var roundedPrice = Math.Round(unitPriceAtSale, 2, MidpointRounding.AwayFromZero);
        var lineSubtotal = Math.Round(quantity * roundedPrice, 2, MidpointRounding.AwayFromZero);
        var discountAmount = Math.Round(lineSubtotal * (discountPercentage / 100m), 2, MidpointRounding.AwayFromZero);

        return new InvoiceItem
        {
            InvoiceId = invoiceId,
            ProductId = productId,
            BatchId = batchId,
            Quantity = quantity,
            UnitId = unitId,
            UnitName = unitName,
            ConversionFactor = conversionFactor,
            BaseQuantity = quantity * conversionFactor,
            UnitPriceAtSale = roundedPrice,
            UnitCostAtSale = unitCostAtSale,
            DiscountPercentage = discountPercentage,
            DiscountAmount = discountAmount
        };
    }
}

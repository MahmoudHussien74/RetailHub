using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

/// <summary>
/// Represents a sellable unit for a product (e.g. box/علبة, strip/شريط, tablet/قرص).
/// Each unit has its own conversion factor to the base unit, sale price, and optional barcode.
/// Stock is always stored in the smallest base unit (ConversionFactor = 1).
/// </summary>
public class ProductUnit : AuditableEntity
{
    public Guid ProductId { get; private set; }

    /// <summary>
    /// Display name of this unit (e.g. علبة, شريط, قرص).
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// How many base units in this unit. E.g. box=30, strip=10, tablet=1.
    /// Must be a positive integer.
    /// </summary>
    public int ConversionFactor { get; private set; }

    /// <summary>
    /// Sale price per this unit. Each unit has its own explicit price.
    /// </summary>
    public decimal SalePrice { get; private set; }

    /// <summary>
    /// Optional barcode for this specific unit (e.g. box barcode vs strip barcode).
    /// </summary>
    public string? Barcode { get; private set; }

    /// <summary>
    /// If true, this unit is selected by default in the POS when adding this product.
    /// Only one unit per product should be the default.
    /// </summary>
    public bool IsDefaultSale { get; private set; }

    // Navigation
    public Product Product { get; private set; } = null!;

    private ProductUnit() { } // EF Core

    public static ProductUnit Create(
        Guid productId,
        string name,
        int conversionFactor,
        decimal salePrice,
        string? barcode = null,
        bool isDefaultSale = false)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Unit name is required.", nameof(name));

        if (conversionFactor <= 0)
            throw new ArgumentException("Conversion factor must be positive.", nameof(conversionFactor));

        if (salePrice < 0)
            throw new ArgumentException("Sale price cannot be negative.", nameof(salePrice));

        return new ProductUnit
        {
            ProductId = productId,
            Name = name.Trim(),
            ConversionFactor = conversionFactor,
            SalePrice = Math.Round(salePrice, 2, MidpointRounding.AwayFromZero),
            Barcode = barcode?.Trim(),
            IsDefaultSale = isDefaultSale
        };
    }

    public void Update(string name, int conversionFactor, decimal salePrice, string? barcode, bool isDefaultSale)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Unit name is required.", nameof(name));

        if (conversionFactor <= 0)
            throw new ArgumentException("Conversion factor must be positive.", nameof(conversionFactor));

        if (salePrice < 0)
            throw new ArgumentException("Sale price cannot be negative.", nameof(salePrice));

        Name = name.Trim();
        ConversionFactor = conversionFactor;
        SalePrice = Math.Round(salePrice, 2, MidpointRounding.AwayFromZero);
        Barcode = barcode?.Trim();
        IsDefaultSale = isDefaultSale;
    }
}

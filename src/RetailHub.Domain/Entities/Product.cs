using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Product : AuditableEntity
{
    public string Barcode { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public Guid CategoryId { get; private set; }
    public Guid BrandId { get; private set; }
    public decimal SellingPrice { get; private set; }
    public decimal AverageCost { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation properties (no EF Core attributes — configured in Infrastructure)
    public Category Category { get; private set; } = null!;
    public Brand Brand { get; private set; } = null!;
    public ICollection<Batch> Batches { get; private set; } = [];

    private Product() { } // EF Core

    public static Product Create(
        string barcode,
        string name,
        Guid categoryId,
        Guid brandId,
        decimal sellingPrice)
    {
        return new Product
        {
            Barcode = barcode,
            Name = name,
            CategoryId = categoryId,
            BrandId = brandId,
            SellingPrice = sellingPrice,
            AverageCost = 0m
        };
    }

    public void Update(string name, Guid categoryId, Guid brandId)
    {
        Name = name;
        CategoryId = categoryId;
        BrandId = brandId;
    }

    public void UpdateSellingPrice(decimal newPrice)
    {
        if (newPrice < 0)
            throw new ArgumentException("Selling price cannot be negative.", nameof(newPrice));

        SellingPrice = newPrice;
    }

    /// <summary>
    /// Recalculates AverageCost from the currently available batches.
    /// Formula: Sum(batch.PurchasePrice * batch.Quantity) / Sum(batch.Quantity)
    /// Must be called within the same transaction as the Batch add/modification.
    /// </summary>
    public void RecalculateAverageCost(IReadOnlyList<Batch> availableBatches)
    {
        var totalQuantity = 0;
        var totalCost = 0m;

        foreach (var batch in availableBatches)
        {
            if (batch.Quantity <= 0)
                continue;

            totalQuantity += batch.Quantity;
            totalCost += batch.PurchasePrice * batch.Quantity;
        }

        AverageCost = totalQuantity > 0
            ? totalCost / totalQuantity
            : 0m;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}

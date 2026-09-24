using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Batch : AuditableEntity
{
    public Guid ProductId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public decimal PurchasePrice { get; private set; }
    public int Quantity { get; private set; }
    public DateTime ExpiryDate { get; private set; }
    public Guid? SupplierId { get; private set; }

    // Navigation
    public Product Product { get; private set; } = null!;
    public Warehouse Warehouse { get; private set; } = null!;
    public Supplier? Supplier { get; private set; }

    private Batch() { } // EF Core

    public static Batch Create(
        Guid productId,
        Guid warehouseId,
        decimal purchasePrice,
        int quantity,
        DateTime expiryDate,
        Guid? supplierId = null)
    {
        if (quantity <= 0)
            throw new ArgumentException("Batch quantity must be positive.", nameof(quantity));

        if (purchasePrice < 0)
            throw new ArgumentException("Purchase price cannot be negative.", nameof(purchasePrice));

        return new Batch
        {
            ProductId = productId,
            WarehouseId = warehouseId,
            PurchasePrice = purchasePrice,
            Quantity = quantity,
            ExpiryDate = expiryDate,
            SupplierId = supplierId
        };
    }

    /// <summary>
    /// Deducts quantity from this batch. Used during FEFO sale processing.
    /// </summary>
    public void DeductQuantity(int amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Deduction amount must be positive.", nameof(amount));

        if (amount > Quantity)
            throw new InvalidOperationException(
                $"Cannot deduct {amount} from batch with only {Quantity} remaining.");

        Quantity -= amount;
    }

    /// <summary>
    /// Adds quantity back to this batch. Used for return processing.
    /// </summary>
    public void AddQuantity(int amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Addition amount must be positive.", nameof(amount));

        Quantity += amount;
    }

    public bool IsExpired() => ExpiryDate < DateTime.UtcNow;

    public bool HasStock() => Quantity > 0;
}

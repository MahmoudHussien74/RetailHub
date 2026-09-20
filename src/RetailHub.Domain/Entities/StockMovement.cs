using RetailHub.Domain.Common;
using RetailHub.Domain.Enums;

namespace RetailHub.Domain.Entities;

public class StockMovement : AuditableEntity
{
    public Guid ProductId { get; private set; }
    public Guid BatchId { get; private set; }
    public StockMovementType Type { get; private set; }
    public int Quantity { get; private set; }
    public DateTime MovementDate { get; private set; }
    public Guid? ReferenceId { get; private set; }
    public bool IsVoided { get; private set; }

    // Navigation
    public Product Product { get; private set; } = null!;
    public Batch Batch { get; private set; } = null!;

    private StockMovement() { } // EF Core

    public static StockMovement Create(
        Guid productId,
        Guid batchId,
        StockMovementType type,
        int quantity,
        Guid? referenceId = null)
    {
        return new StockMovement
        {
            ProductId = productId,
            BatchId = batchId,
            Type = type,
            Quantity = quantity,
            MovementDate = DateTime.UtcNow,
            ReferenceId = referenceId,
            IsVoided = false
        };
    }

    /// <summary>
    /// Marks this movement as voided (soft-delete for financial records).
    /// </summary>
    public void Void() => IsVoided = true;
}

namespace RetailHub.Domain.Common;

/// <summary>
/// Base class for all domain entities. Provides identity and audit timestamps.
/// Timestamps are set by the Infrastructure layer (DbContext override), not here.
/// </summary>
public abstract class AuditableEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Warehouse : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Address { get; private set; }
    public bool IsDefault { get; private set; }

    // Navigation
    public ICollection<Batch> Batches { get; private set; } = [];

    private Warehouse() { } // EF Core

    public static Warehouse Create(string name, string? address = null, bool isDefault = false)
    {
        return new Warehouse
        {
            Name = name,
            Address = address,
            IsDefault = isDefault
        };
    }
}

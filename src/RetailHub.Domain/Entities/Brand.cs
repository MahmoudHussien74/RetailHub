using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Brand : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<Product> Products { get; private set; } = [];

    private Brand() { } // EF Core

    public static Brand Create(string name)
    {
        return new Brand { Name = name };
    }

    public void Update(string name)
    {
        Name = name;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}

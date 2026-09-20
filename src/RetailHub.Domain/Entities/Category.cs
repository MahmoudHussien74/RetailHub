using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Category : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<Product> Products { get; private set; } = [];

    private Category() { } // EF Core

    public static Category Create(string name, string? description = null)
    {
        return new Category
        {
            Name = name,
            Description = description
        };
    }

    public void Update(string name, string? description)
    {
        Name = name;
        Description = description;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}

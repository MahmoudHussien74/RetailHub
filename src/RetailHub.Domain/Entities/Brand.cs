using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Brand : AuditableEntity
{
    public string NameAr { get; private set; } = string.Empty;
    public string? NameEn { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<Product> Products { get; private set; } = [];

    private Brand() { } // EF Core

    public static Brand Create(string nameAr, string? nameEn = null)
    {
        return new Brand
        {
            NameAr = nameAr,
            NameEn = nameEn
        };
    }

    public void Update(string nameAr, string? nameEn)
    {
        NameAr = nameAr;
        NameEn = nameEn;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}

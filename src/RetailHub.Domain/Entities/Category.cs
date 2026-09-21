using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Category : AuditableEntity
{
    public string NameAr { get; private set; } = string.Empty;
    public string? NameEn { get; private set; }
    public string? DescriptionAr { get; private set; }
    public string? DescriptionEn { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<Product> Products { get; private set; } = [];

    private Category() { } // EF Core

    public static Category Create(
        string nameAr,
        string? nameEn = null,
        string? descriptionAr = null,
        string? descriptionEn = null)
    {
        return new Category
        {
            NameAr = nameAr,
            NameEn = nameEn,
            DescriptionAr = descriptionAr,
            DescriptionEn = descriptionEn
        };
    }

    public void Update(
        string nameAr,
        string? nameEn,
        string? descriptionAr,
        string? descriptionEn)
    {
        NameAr = nameAr;
        NameEn = nameEn;
        DescriptionAr = descriptionAr;
        DescriptionEn = descriptionEn;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}

namespace RetailHub.Application.Features.Products.DTOs;

public class ProductListDto
{
    public Guid Id { get; init; }
    public string Barcode { get; init; } = string.Empty;
    public string NameAr { get; init; } = string.Empty;
    public string? NameEn { get; init; }
    public string CategoryNameAr { get; init; } = string.Empty;
    public string? CategoryNameEn { get; init; }
    public string BrandNameAr { get; init; } = string.Empty;
    public string? BrandNameEn { get; init; }
    public decimal SellingPrice { get; init; }
    public decimal AverageCost { get; init; }
    public int TotalStock { get; init; }
}

using RetailHub.Application.Features.Batches.DTOs;

namespace RetailHub.Application.Features.Products.DTOs;

public class ProductDetailDto
{
    public Guid Id { get; init; }
    public string Barcode { get; init; } = string.Empty;
    public string NameAr { get; init; } = string.Empty;
    public string? NameEn { get; init; }
    public Guid CategoryId { get; init; }
    public string CategoryNameAr { get; init; } = string.Empty;
    public string? CategoryNameEn { get; init; }
    public Guid BrandId { get; init; }
    public string BrandNameAr { get; init; } = string.Empty;
    public string? BrandNameEn { get; init; }
    public decimal SellingPrice { get; init; }
    public decimal AverageCost { get; init; }
    public int TotalStock { get; init; }
    public bool IsActive { get; init; }
    public List<BatchDto> Batches { get; init; } = [];
}

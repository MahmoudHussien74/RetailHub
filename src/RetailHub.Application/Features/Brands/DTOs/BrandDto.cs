namespace RetailHub.Application.Features.Brands.DTOs;

public class BrandDto
{
    public Guid Id { get; init; }
    public string NameAr { get; init; } = string.Empty;
    public string? NameEn { get; init; }
    public bool IsActive { get; init; }
}

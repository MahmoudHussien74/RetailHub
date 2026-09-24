namespace RetailHub.Application.Features.Brands.DTOs;

/// <summary>
/// Clean HTTP Request model for updating a brand.
/// Brand Id is supplied via URL route, not body.
/// </summary>
public record UpdateBrandRequest(
    string NameAr,
    string? NameEn = null);

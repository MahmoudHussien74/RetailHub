namespace RetailHub.Application.Features.Products.DTOs;

/// <summary>
/// Clean HTTP Request model for updating a product.
/// Product Id is supplied via URL route, not body.
/// </summary>
public record UpdateProductRequest(
    string NameAr,
    string? NameEn,
    Guid CategoryId,
    Guid BrandId);

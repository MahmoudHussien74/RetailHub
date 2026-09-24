namespace RetailHub.Application.Features.Categories.DTOs;

/// <summary>
/// Clean HTTP Request model for updating a category.
/// Category Id is supplied via URL route, not body.
/// </summary>
public record UpdateCategoryRequest(
    string NameAr,
    string? NameEn = null,
    string? DescriptionAr = null,
    string? DescriptionEn = null);

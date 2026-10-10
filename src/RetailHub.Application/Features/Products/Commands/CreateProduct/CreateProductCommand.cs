using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Products.Commands.CreateProduct;

public record ProductUnitInputDto(
    string Name,
    int ConversionFactor,
    decimal SalePrice,
    string? Barcode = null,
    bool IsDefaultSale = false);

public record CreateProductCommand(
    string? Barcode,
    string NameAr,
    string? NameEn,
    Guid CategoryId,
    Guid BrandId,
    decimal SellingPrice,
    decimal? PurchasePrice = null,
    int? InitialStock = null,
    DateTime? ExpiryDate = null,
    List<ProductUnitInputDto>? Units = null) : IRequest<Result<Guid>>;

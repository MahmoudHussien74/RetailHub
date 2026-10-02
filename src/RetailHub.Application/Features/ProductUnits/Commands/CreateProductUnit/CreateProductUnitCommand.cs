using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.ProductUnits.DTOs;

namespace RetailHub.Application.Features.ProductUnits.Commands.CreateProductUnit;

public record CreateProductUnitCommand(
    Guid ProductId,
    string Name,
    int ConversionFactor,
    decimal SalePrice,
    string? Barcode = null,
    bool IsDefaultSale = false) : IRequest<Result<ProductUnitDto>>;

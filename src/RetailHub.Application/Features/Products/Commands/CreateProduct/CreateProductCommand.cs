using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Products.Commands.CreateProduct;

public record CreateProductCommand(
    string Barcode,
    string NameAr,
    string? NameEn,
    Guid CategoryId,
    Guid BrandId,
    decimal SellingPrice) : IRequest<Result<Guid>>;

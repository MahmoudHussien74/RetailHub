using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand(
    Guid Id,
    string NameAr,
    string? NameEn,
    Guid CategoryId,
    Guid BrandId) : IRequest<Result>;

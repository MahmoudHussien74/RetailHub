using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Products.DTOs;

namespace RetailHub.Application.Features.Products.Queries.GetProductById;

public record GetProductByIdQuery(Guid Id) : IRequest<Result<ProductDetailDto>>;

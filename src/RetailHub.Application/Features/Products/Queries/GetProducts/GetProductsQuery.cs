using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Products.DTOs;

namespace RetailHub.Application.Features.Products.Queries.GetProducts;

public record GetProductsQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null) : IRequest<Result<PagedResult<ProductListDto>>>;

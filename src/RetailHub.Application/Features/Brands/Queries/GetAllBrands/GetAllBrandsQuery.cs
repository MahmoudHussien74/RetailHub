using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Brands.DTOs;

namespace RetailHub.Application.Features.Brands.Queries.GetAllBrands;

public record GetAllBrandsQuery(int Page = 1, int PageSize = 10) : IRequest<Result<PagedResult<BrandDto>>>;

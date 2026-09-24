using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Brands.DTOs;

namespace RetailHub.Application.Features.Brands.Queries.GetBrandById;

public record GetBrandByIdQuery(Guid Id) : IRequest<Result<BrandDto>>;

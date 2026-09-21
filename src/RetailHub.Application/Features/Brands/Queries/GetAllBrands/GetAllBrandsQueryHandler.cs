using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Brands.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Brands.Queries.GetAllBrands;

public class GetAllBrandsQueryHandler
    : IRequestHandler<GetAllBrandsQuery, Result<PagedResult<BrandDto>>>
{
    private readonly IAppDbContext _context;

    public GetAllBrandsQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<BrandDto>>> Handle(
        GetAllBrandsQuery request, CancellationToken ct)
    {
        var query = _context.Brands
            .Where(b => b.IsActive)
            .OrderBy(b => b.NameAr);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectToType<BrandDto>()
            .ToListAsync(ct);

        var pagedResult = new PagedResult<BrandDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<BrandDto>>.Success(pagedResult);
    }
}

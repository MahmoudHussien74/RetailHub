using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Categories.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Categories.Queries.GetAllCategories;

public class GetAllCategoriesQueryHandler
    : IRequestHandler<GetAllCategoriesQuery, Result<PagedResult<CategoryDto>>>
{
    private readonly IAppDbContext _context;

    public GetAllCategoriesQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<CategoryDto>>> Handle(
        GetAllCategoriesQuery request, CancellationToken ct)
    {
        var query = _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.NameAr);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectToType<CategoryDto>()
            .ToListAsync(ct);

        var pagedResult = new PagedResult<CategoryDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<CategoryDto>>.Success(pagedResult);
    }
}

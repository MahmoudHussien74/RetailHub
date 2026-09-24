using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Suppliers.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Suppliers.Queries.GetSuppliers;

public class GetSuppliersQueryHandler
    : IRequestHandler<GetSuppliersQuery, Result<PagedResult<SupplierListDto>>>
{
    private readonly IAppDbContext _context;

    public GetSuppliersQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<SupplierListDto>>> Handle(
        GetSuppliersQuery request, CancellationToken ct)
    {
        var query = _context.Suppliers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(s => s.Name.Contains(search));
        }

        if (request.IsActive.HasValue)
            query = query.Where(s => s.IsActive == request.IsActive.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new SupplierListDto
            {
                Id = s.Id,
                Name = s.Name,
                Phone = s.Phone,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<SupplierListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<SupplierListDto>>.Success(pagedResult);
    }
}

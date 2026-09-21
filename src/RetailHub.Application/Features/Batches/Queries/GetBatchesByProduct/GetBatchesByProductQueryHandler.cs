using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Batches.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Batches.Queries.GetBatchesByProduct;

public class GetBatchesByProductQueryHandler
    : IRequestHandler<GetBatchesByProductQuery, Result<PagedResult<BatchDto>>>
{
    private readonly IAppDbContext _context;

    public GetBatchesByProductQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<BatchDto>>> Handle(
        GetBatchesByProductQuery request, CancellationToken ct)
    {
        var query = _context.Batches
            .Where(b => b.ProductId == request.ProductId && b.Quantity > 0)
            .OrderBy(b => b.ExpiryDate);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectToType<BatchDto>()
            .ToListAsync(ct);

        var pagedResult = new PagedResult<BatchDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<BatchDto>>.Success(pagedResult);
    }
}

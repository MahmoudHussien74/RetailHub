using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.StockMovements.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.StockMovements.Queries.GetMovementsByProduct;

public class GetMovementsByProductQueryHandler
    : IRequestHandler<GetMovementsByProductQuery, Result<PagedResult<StockMovementDto>>>
{
    private readonly IAppDbContext _context;

    public GetMovementsByProductQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<StockMovementDto>>> Handle(
        GetMovementsByProductQuery request, CancellationToken ct)
    {
        var query = _context.StockMovements
            .Where(sm => sm.ProductId == request.ProductId)
            .OrderByDescending(sm => sm.MovementDate);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectToType<StockMovementDto>()
            .ToListAsync(ct);

        var pagedResult = new PagedResult<StockMovementDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<StockMovementDto>>.Success(pagedResult);
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.StockAdjustments.DTOs;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.StockAdjustments.Queries.GetStockAdjustments;

public class GetStockAdjustmentsQueryHandler
    : IRequestHandler<GetStockAdjustmentsQuery, Result<StockAdjustmentListDto>>
{
    private readonly IAppDbContext _db;

    public GetStockAdjustmentsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<StockAdjustmentListDto>> Handle(
        GetStockAdjustmentsQuery request, CancellationToken ct)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var query = _db.StockMovements.Where(sm =>
            !sm.IsVoided &&
            (sm.Type == StockMovementType.Damage || sm.Type == StockMovementType.Adjustment));

        if (request.From.HasValue)
            query = query.Where(sm => sm.MovementDate >= request.From.Value);
        if (request.To.HasValue)
            query = query.Where(sm => sm.MovementDate < request.To.Value.Date.AddDays(1));

        var totalCount = await query.CountAsync(ct);

        // ── Summary (computed in the database) ──
        var damageCost = await query
            .Where(sm => sm.Type == StockMovementType.Damage)
            .SumAsync(sm => (decimal?)(sm.Quantity * sm.Batch.PurchasePrice), ct) ?? 0m;
        var shortageCost = await query
            .Where(sm => sm.Type == StockMovementType.Adjustment && sm.Quantity < 0)
            .SumAsync(sm => (decimal?)(-sm.Quantity * sm.Batch.PurchasePrice), ct) ?? 0m;
        var surplusValue = await query
            .Where(sm => sm.Type == StockMovementType.Adjustment && sm.Quantity > 0)
            .SumAsync(sm => (decimal?)(sm.Quantity * sm.Batch.PurchasePrice), ct) ?? 0m;
        var writeOffCount = await query.CountAsync(sm => sm.Type == StockMovementType.Damage, ct);
        var adjustmentCount = totalCount - writeOffCount;

        // ── Page of rows (enum converted client-side to avoid provider-specific ToString translation) ──
        var rows = await query
            .OrderByDescending(sm => sm.MovementDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(sm => new
            {
                sm.Id,
                sm.ProductId,
                ProductNameAr = sm.Product.NameAr,
                sm.Product.Barcode,
                sm.BatchId,
                BatchExpiryDate = sm.Batch.ExpiryDate,
                sm.Type,
                sm.Quantity,
                UnitCost = sm.Batch.PurchasePrice,
                sm.Notes,
                sm.MovementDate
            })
            .ToListAsync(ct);

        var items = rows.Select(r => new StockAdjustmentDto
        {
            Id = r.Id,
            ProductId = r.ProductId,
            ProductNameAr = r.ProductNameAr,
            Barcode = r.Barcode,
            BatchId = r.BatchId,
            BatchExpiryDate = r.BatchExpiryDate,
            Type = r.Type.ToString(),
            Quantity = r.Quantity,
            UnitCost = r.UnitCost,
            // Damage always removes stock (loss). Adjustment is signed: shortage = loss, surplus = gain.
            ValueImpact = Math.Round(
                (r.Type == StockMovementType.Damage ? -r.Quantity : r.Quantity) * r.UnitCost, 2),
            Notes = r.Notes,
            MovementDate = r.MovementDate
        }).ToList();

        return Result<StockAdjustmentListDto>.Success(new StockAdjustmentListDto
        {
            Summary = new StockAdjustmentSummaryDto
            {
                TotalLoss = Math.Round(damageCost + shortageCost, 2),
                TotalSurplus = Math.Round(surplusValue, 2),
                WriteOffCount = writeOffCount,
                AdjustmentCount = adjustmentCount
            },
            Page = new PagedResult<StockAdjustmentDto>(items, totalCount, page, pageSize)
        });
    }
}

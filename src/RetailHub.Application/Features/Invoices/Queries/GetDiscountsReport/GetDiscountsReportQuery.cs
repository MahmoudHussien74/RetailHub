using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Invoices.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Invoices.Queries.GetDiscountsReport;

public record GetDiscountsReportQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<DiscountReportDto>>>;

public class GetDiscountsReportQueryHandler
    : IRequestHandler<GetDiscountsReportQuery, Result<PagedResult<DiscountReportDto>>>
{
    private readonly IAppDbContext _context;

    public GetDiscountsReportQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<DiscountReportDto>>> Handle(
        GetDiscountsReportQuery request, CancellationToken ct)
    {
        var query = _context.Invoices
            .Where(i => !i.IsVoided && i.DiscountAmount > 0);

        if (request.FromDate.HasValue)
            query = query.Where(i => i.CreatedAt >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(i => i.CreatedAt <= request.ToDate.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(i => new DiscountReportDto
            {
                InvoiceId = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CreatedAt = i.CreatedAt,
                Subtotal = i.Subtotal,
                DiscountPercent = i.DiscountPercent,
                DiscountAmount = i.DiscountAmount,
                TotalAmount = i.TotalAmount,
                DiscountReason = i.DiscountReason,
                DiscountedByUserId = i.DiscountedByUserId,
                DiscountedByUserName = "الكاشير / الإدارة"
            })
            .ToListAsync(ct);

        return Result<PagedResult<DiscountReportDto>>.Success(
            new PagedResult<DiscountReportDto>(items, totalCount, request.Page, request.PageSize));
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Invoices.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Invoices.Queries.GetInvoices;

public class GetInvoicesQueryHandler
    : IRequestHandler<GetInvoicesQuery, Result<PagedResult<InvoiceListDto>>>
{
    private readonly IAppDbContext _context;

    public GetInvoicesQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<InvoiceListDto>>> Handle(
        GetInvoicesQuery request, CancellationToken ct)
    {
        var query = _context.Invoices.AsQueryable();

        // Apply filters
        if (request.Status.HasValue)
            query = query.Where(i => i.PaymentStatus == request.Status.Value);

        if (request.FromDate.HasValue)
            query = query.Where(i => i.CreatedAt >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(i => i.CreatedAt <= request.ToDate.Value);

        if (request.IsVoided.HasValue)
            query = query.Where(i => i.IsVoided == request.IsVoided.Value);

        var totalCount = await query.CountAsync(ct);

        // Projection + Pagination — no ToListAsync without Skip/Take
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(i => new InvoiceListDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                PaymentStatus = i.PaymentStatus.ToString(),
                TotalAmount = i.TotalAmount,
                AmountPaid = i.AmountPaid,
                ItemCount = i.Items.Count,
                IsVoided = i.IsVoided,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<InvoiceListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<InvoiceListDto>>.Success(pagedResult);
    }
}

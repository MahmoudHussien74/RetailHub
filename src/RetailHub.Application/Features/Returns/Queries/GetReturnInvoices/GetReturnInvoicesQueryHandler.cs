using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Returns.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Returns.Queries.GetReturnInvoices;

public class GetReturnInvoicesQueryHandler
    : IRequestHandler<GetReturnInvoicesQuery, Result<PagedResult<ReturnInvoiceListDto>>>
{
    private readonly IAppDbContext _context;

    public GetReturnInvoicesQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<ReturnInvoiceListDto>>> Handle(
        GetReturnInvoicesQuery request, CancellationToken ct)
    {
        var query = _context.ReturnInvoices.AsQueryable();

        if (request.OriginalInvoiceId.HasValue)
            query = query.Where(r => r.OriginalInvoiceId == request.OriginalInvoiceId.Value);

        if (request.CustomerId.HasValue)
            query = query.Where(r => r.CustomerId == request.CustomerId.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(r => r.ReturnDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new ReturnInvoiceListDto
            {
                Id = r.Id,
                OriginalInvoiceId = r.OriginalInvoiceId,
                OriginalInvoiceNumber = r.OriginalInvoice.InvoiceNumber,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer != null ? r.Customer.Name : null,
                TotalRefundAmount = r.TotalRefundAmount,
                ItemCount = r.Items.Count,
                ReturnDate = r.ReturnDate
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<ReturnInvoiceListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<ReturnInvoiceListDto>>.Success(pagedResult);
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Purchases.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Purchases.Queries.GetPurchaseInvoices;

public class GetPurchaseInvoicesQueryHandler
    : IRequestHandler<GetPurchaseInvoicesQuery, Result<PagedResult<PurchaseInvoiceListDto>>>
{
    private readonly IAppDbContext _context;

    public GetPurchaseInvoicesQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<PurchaseInvoiceListDto>>> Handle(
        GetPurchaseInvoicesQuery request, CancellationToken ct)
    {
        var query = _context.PurchaseInvoices.AsQueryable();

        if (request.SupplierId.HasValue)
            query = query.Where(p => p.SupplierId == request.SupplierId.Value);

        if (request.FromDate.HasValue)
            query = query.Where(p => p.PurchaseDate >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(p => p.PurchaseDate <= request.ToDate.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(p => p.PurchaseDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new PurchaseInvoiceListDto
            {
                Id = p.Id,
                InvoiceNumber = p.InvoiceNumber,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier.Name,
                TotalAmount = p.TotalAmount,
                ItemCount = p.Items.Count,
                PurchaseDate = p.PurchaseDate
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<PurchaseInvoiceListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<PurchaseInvoiceListDto>>.Success(pagedResult);
    }
}

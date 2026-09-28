using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.CashDrawer.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.CashDrawer.Queries.GetTransactions;

public class GetCashDrawerTransactionsQueryHandler
    : IRequestHandler<GetCashDrawerTransactionsQuery, Result<PagedResult<CashDrawerTransactionDto>>>
{
    private readonly IAppDbContext _context;

    public GetCashDrawerTransactionsQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<CashDrawerTransactionDto>>> Handle(
        GetCashDrawerTransactionsQuery request, CancellationToken ct)
    {
        var dateUtc = request.Date.Date;
        var nextDay = dateUtc.AddDays(1);

        var query = _context.CashDrawerTransactions
            .Where(t => t.TransactionDate >= dateUtc && t.TransactionDate < nextDay);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new CashDrawerTransactionDto
            {
                Id = t.Id,
                TransactionDate = t.TransactionDate,
                Type = t.Type.ToString(),
                Amount = t.Amount,
                ReferenceId = t.ReferenceId,
                Notes = t.Notes
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<CashDrawerTransactionDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<CashDrawerTransactionDto>>.Success(pagedResult);
    }
}

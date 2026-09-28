using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.CashDrawer.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.CashDrawer.Queries.GetDailySummary;

public class GetDailySummaryQueryHandler
    : IRequestHandler<GetDailySummaryQuery, Result<DailySummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetDailySummaryQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<DailySummaryDto>> Handle(GetDailySummaryQuery request, CancellationToken ct)
    {
        var dateUtc = request.Date.Date;
        var nextDay = dateUtc.AddDays(1);

        // Opening balance = sum of all transactions before today
        var openingBalance = await _context.CashDrawerTransactions
            .Where(t => t.TransactionDate < dateUtc)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        // Today's transactions
        var todayTransactions = _context.CashDrawerTransactions
            .Where(t => t.TransactionDate >= dateUtc && t.TransactionDate < nextDay);

        var totalInflows = await todayTransactions
            .Where(t => t.Amount > 0)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        var totalOutflows = await todayTransactions
            .Where(t => t.Amount < 0)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        var transactionCount = await todayTransactions.CountAsync(ct);

        var summary = new DailySummaryDto
        {
            Date = dateUtc,
            OpeningBalance = openingBalance,
            TotalInflows = totalInflows,
            TotalOutflows = totalOutflows,
            ClosingBalance = openingBalance + totalInflows + totalOutflows,
            TransactionCount = transactionCount
        };

        return Result<DailySummaryDto>.Success(summary);
    }
}

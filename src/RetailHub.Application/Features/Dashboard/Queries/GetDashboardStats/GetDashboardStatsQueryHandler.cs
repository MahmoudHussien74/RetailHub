using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Dashboard.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Dashboard.Queries.GetDashboardStats;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, Result<DashboardStatsDto>>
{
    private readonly IAppDbContext _context;

    public GetDashboardStatsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<DashboardStatsDto>> Handle(GetDashboardStatsQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);
        var yesterdayStart = todayStart.AddDays(-1);

        // 1. Sales & Invoices
        var todayInvoices = _context.Invoices.Where(i => !i.IsVoided && i.CreatedAt >= todayStart && i.CreatedAt < todayEnd);
        var todaySales = await todayInvoices.SumAsync(i => (decimal?)i.TotalAmount, ct) ?? 0m;
        var todayInvoicesCount = await todayInvoices.CountAsync(ct);

        var yesterdaySales = await _context.Invoices
            .Where(i => !i.IsVoided && i.CreatedAt >= yesterdayStart && i.CreatedAt < todayStart)
            .SumAsync(i => (decimal?)i.TotalAmount, ct) ?? 0m;

        var salesGrowth = yesterdaySales > 0
            ? Math.Round(((todaySales - yesterdaySales) / yesterdaySales) * 100m, 1)
            : (todaySales > 0 ? 100m : 0m);

        var avgInvoice = todayInvoicesCount > 0
            ? Math.Round(todaySales / todayInvoicesCount, 2)
            : 0m;

        // 2. Cash Drawer Balance (from transactions or active shift)
        var cashDrawerBalance = await _context.CashDrawerTransactions
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        // 3. Products & Stock Counts
        var productStocks = await _context.Products
            .Where(p => p.IsActive)
            .Select(p => new
            {
                p.Id,
                Stock = p.Batches.Where(b => b.Quantity > 0).Sum(b => (int?)b.Quantity) ?? 0
            })
            .ToListAsync(ct);

        var totalProducts = productStocks.Count;
        var outOfStockCount = productStocks.Count(p => p.Stock <= 0);
        var lowStockCount = productStocks.Count(p => p.Stock > 0 && p.Stock <= 5);

        // 4. Near Expiry Batches (within next 60 days)
        var expiryThreshold = now.AddDays(60);
        var nearExpiryCount = await _context.Batches
            .CountAsync(b => b.Quantity > 0 && b.ExpiryDate <= expiryThreshold, ct);

        // 5. Total Customers
        var totalCustomers = await _context.Customers.CountAsync(ct);

        // 6. Recent Invoices
        var recentInvoices = await _context.Invoices
            .Where(i => !i.IsVoided)
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new RecentInvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerName = i.Customer != null ? i.Customer.Name : "عميل نقدي",
                TotalAmount = i.TotalAmount,
                CreatedAt = i.CreatedAt,
                PaymentStatus = i.PaymentStatus.ToString()
            })
            .ToListAsync(ct);

        var result = new DashboardStatsDto
        {
            TodaySales = todaySales,
            TodayInvoicesCount = todayInvoicesCount,
            AverageInvoiceAmount = avgInvoice,
            SalesGrowthPercentage = salesGrowth,
            CashDrawerBalance = cashDrawerBalance,
            LowStockProductsCount = lowStockCount,
            OutOfStockProductsCount = outOfStockCount,
            NearExpiryBatchesCount = nearExpiryCount,
            TotalProductsCount = totalProducts,
            TotalCustomersCount = totalCustomers,
            RecentInvoices = recentInvoices
        };

        return Result<DashboardStatsDto>.Success(result);
    }
}

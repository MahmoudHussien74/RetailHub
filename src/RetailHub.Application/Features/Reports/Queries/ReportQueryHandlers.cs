using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Reports.DTOs;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Reports.Queries;

// ═══════════════════════════════════════════════════════════════
// 1. PROFIT & LOSS REPORT
// ═══════════════════════════════════════════════════════════════
public class GetProfitLossReportQueryHandler
    : IRequestHandler<GetProfitLossReportQuery, Result<ProfitLossReportDto>>
{
    private readonly IAppDbContext _db;
    public GetProfitLossReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<ProfitLossReportDto>> Handle(
        GetProfitLossReportQuery request, CancellationToken ct)
    {
        var from = request.FromDate.Date;
        var to = request.ToDate.Date.AddDays(1);

        // Sales invoices (non-voided)
        var invoices = await _db.Invoices
            .Where(i => !i.IsVoided && i.CreatedAt >= from && i.CreatedAt < to)
            .Select(i => new
            {
                i.TotalAmount,
                i.Subtotal,
                i.DiscountAmount,
                i.CreatedAt
            })
            .ToListAsync(ct);

        // Invoice items for COGS
        var invoiceItems = await _db.InvoiceItems
            .Where(ii => !ii.Invoice.IsVoided && ii.Invoice.CreatedAt >= from && ii.Invoice.CreatedAt < to)
            .Select(ii => new
            {
                Revenue = ii.Quantity * ii.UnitPriceAtSale * (1m - ii.DiscountPercentage / 100m),
                Cost = ii.BaseQuantity * ii.UnitCostAtSale,
                ii.Invoice.CreatedAt
            })
            .ToListAsync(ct);

        // Returns with line item details for COGS reduction and period breakdown
        var returns = await _db.ReturnInvoices
            .Where(r => r.CreatedAt >= from && r.CreatedAt < to)
            .Select(r => new { r.Id, r.TotalRefundAmount, r.CreatedAt })
            .ToListAsync(ct);

        var returnItems = await _db.ReturnInvoiceItems
            .Where(r => r.ReturnInvoice.CreatedAt >= from && r.ReturnInvoice.CreatedAt < to)
            .Select(r => new
            {
                r.ReturnInvoiceId,
                RefundAmount = r.Quantity * r.UnitPriceAtSale * (1m - r.DiscountPercentage / 100m),
                // Undamaged returns reduce Cost of Goods Sold because items were restored to inventory
                ReturnedCost = !r.IsDamaged 
                    ? (r.BaseQuantity > 0 ? r.BaseQuantity : (r.Quantity * (r.ConversionFactor > 0 ? r.ConversionFactor : 1))) * r.InvoiceItem.UnitCostAtSale 
                    : 0m,
                r.IsDamaged,
                CreatedAt = r.ReturnInvoice.CreatedAt
            })
            .ToListAsync(ct);

        // Operating Expenses from cash drawer
        // Strictly exclude purchase invoice payments to prevent double-counting inventory purchases
        var expenses = await _db.CashDrawerTransactions
            .Where(c => c.Type == CashDrawerTransactionType.Expense
                        && c.TransactionDate >= from && c.TransactionDate < to
                        && (!c.ReferenceId.HasValue || !_db.PurchaseInvoices.Any(p => p.Id == c.ReferenceId.Value))
                        && (c.Notes == null || (!c.Notes.Contains("شراء") && !c.Notes.Contains("مشتريات"))))
            .SumAsync(c => (decimal?)Math.Abs(c.Amount), ct) ?? 0m;

        // Salary advances
        var salaryAdvances = await _db.SalaryAdvances
            .Where(s => s.AdvanceDate >= from && s.AdvanceDate < to)
            .SumAsync(s => (decimal?)s.Amount, ct) ?? 0m;

        // Purchases total
        var purchases = await _db.PurchaseInvoices
            .Where(p => p.PurchaseDate >= from && p.PurchaseDate < to)
            .SumAsync(p => (decimal?)p.TotalAmount, ct) ?? 0m;

        var totalRevenue = invoices.Sum(i => i.TotalAmount);
        var totalReturns = returns.Sum(r => r.TotalRefundAmount);
        var netRevenue = Math.Max(0m, totalRevenue - totalReturns);

        var grossCogs = invoiceItems.Sum(ii => ii.Cost);
        var returnedCogs = returnItems.Sum(ri => ri.ReturnedCost);
        var cogs = Math.Max(0m, grossCogs - returnedCogs);

        var grossProfit = netRevenue - cogs;
        var totalExpenses = expenses + salaryAdvances;
        var netProfit = grossProfit - totalExpenses;

        // Period breakdown: properly accounts for sales AND returns per period
        var breakdown = new List<ProfitLossPeriodRow>();
        var granularity = request.Granularity?.ToLowerInvariant() ?? "daily";

        string GetPeriodKey(DateTime date) => granularity switch
        {
            "monthly" => date.ToString("yyyy-MM"),
            "weekly" => $"{date.Year}-W{CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(date, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday):D2}",
            _ => date.ToString("yyyy-MM-dd")
        };

        var allPeriodKeys = invoiceItems.Select(i => GetPeriodKey(i.CreatedAt))
            .Union(returnItems.Select(r => GetPeriodKey(r.CreatedAt)))
            .Distinct()
            .OrderBy(k => k)
            .ToList();

        foreach (var period in allPeriodKeys)
        {
            var pSales = invoiceItems
                .Where(i => GetPeriodKey(i.CreatedAt) == period)
                .Sum(i => i.Revenue);

            var pReturns = returnItems
                .Where(r => GetPeriodKey(r.CreatedAt) == period)
                .Sum(r => r.RefundAmount);

            var pNetSales = pSales - pReturns;

            var pCost = invoiceItems
                .Where(i => GetPeriodKey(i.CreatedAt) == period)
                .Sum(i => i.Cost);

            var pReturnedCost = returnItems
                .Where(r => GetPeriodKey(r.CreatedAt) == period)
                .Sum(r => r.ReturnedCost);

            var pNetCost = Math.Max(0m, pCost - pReturnedCost);
            var pGrossProfit = pNetSales - pNetCost;

            breakdown.Add(new ProfitLossPeriodRow
            {
                Period = period,
                Sales = Math.Round(pNetSales, 2),
                CostOfGoods = Math.Round(pNetCost, 2),
                GrossProfit = Math.Round(pGrossProfit, 2),
                Expenses = 0,
                NetProfit = Math.Round(pGrossProfit, 2)
            });
        }

        return Result<ProfitLossReportDto>.Success(new ProfitLossReportDto
        {
            FromDate = from,
            ToDate = request.ToDate.Date,
            PeriodLabel = $"{from:yyyy-MM-dd} → {request.ToDate:yyyy-MM-dd}",
            TotalSalesRevenue = Math.Round(totalRevenue, 2),
            TotalReturnsAmount = Math.Round(totalReturns, 2),
            NetSalesRevenue = Math.Round(netRevenue, 2),
            TotalCostOfGoodsSold = Math.Round(cogs, 2),
            GrossProfit = Math.Round(grossProfit, 2),
            GrossProfitMargin = netRevenue > 0 ? Math.Round(grossProfit / netRevenue * 100, 1) : 0,
            TotalExpenses = Math.Round(expenses, 2),
            TotalSalaryAdvances = Math.Round(salaryAdvances, 2),
            NetProfit = Math.Round(netProfit, 2),
            TotalInvoicesCount = invoices.Count,
            TotalReturnInvoicesCount = returns.Count,
            TotalDiscountsGiven = Math.Round(invoices.Sum(i => i.DiscountAmount), 2),
            TotalPurchases = Math.Round(purchases, 2),
            PeriodBreakdown = breakdown
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 2. SALES REPORT (by Product + by Category)
// ═══════════════════════════════════════════════════════════════
public class GetSalesReportQueryHandler
    : IRequestHandler<GetSalesReportQuery, Result<SalesReportDto>>
{
    private readonly IAppDbContext _db;
    public GetSalesReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<SalesReportDto>> Handle(
        GetSalesReportQuery request, CancellationToken ct)
    {
        var from = request.FromDate.Date;
        var to = request.ToDate.Date.AddDays(1);

        var items = await _db.InvoiceItems
            .Where(ii => !ii.Invoice.IsVoided && ii.Invoice.CreatedAt >= from && ii.Invoice.CreatedAt < to)
            .Select(ii => new
            {
                ii.ProductId,
                ProductName = ii.Product.NameAr,
                Barcode = ii.Product.Barcode,
                CategoryId = ii.Product.CategoryId,
                CategoryName = ii.Product.Category.NameAr,
                ii.Quantity,
                ii.BaseQuantity,
                Revenue = ii.Quantity * ii.UnitPriceAtSale * (1m - ii.DiscountPercentage / 100m),
                Cost = ii.BaseQuantity * ii.UnitCostAtSale
            })
            .ToListAsync(ct);

        var returnItems = await _db.ReturnInvoiceItems
            .Where(ri => ri.ReturnInvoice.CreatedAt >= from && ri.ReturnInvoice.CreatedAt < to)
            .Select(ri => new
            {
                ri.ProductId,
                ri.Quantity,
                Refund = ri.Quantity * ri.UnitPriceAtSale * (1m - ri.DiscountPercentage / 100m),
                Cost = ri.IsDamaged ? 0m : ri.Quantity * ri.ConversionFactor * ri.InvoiceItem.UnitCostAtSale
            })
            .ToListAsync(ct);

        var returnsByProduct = returnItems
            .GroupBy(r => r.ProductId)
            .ToDictionary(g => g.Key, g => new
            {
                Quantity = g.Sum(x => x.Quantity),
                Refund = g.Sum(x => x.Refund),
                Cost = g.Sum(x => x.Cost)
            });

        var byProduct = items
            .GroupBy(i => new { i.ProductId, i.ProductName, i.Barcode, i.CategoryName })
            .Select(g =>
            {
                returnsByProduct.TryGetValue(g.Key.ProductId, out var ret);
                var retQty = ret?.Quantity ?? 0;
                var retRefund = ret?.Refund ?? 0m;
                var retCost = ret?.Cost ?? 0m;

                var rev = Math.Max(0m, g.Sum(x => x.Revenue) - retRefund);
                var cost = Math.Max(0m, g.Sum(x => x.Cost) - retCost);
                var qty = Math.Max(0, g.Sum(x => x.Quantity) - retQty);

                return new SalesByProductRow
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    Barcode = g.Key.Barcode,
                    CategoryName = g.Key.CategoryName,
                    QuantitySold = qty,
                    TotalRevenue = Math.Round(rev, 2),
                    TotalCost = Math.Round(cost, 2),
                    Profit = Math.Round(rev - cost, 2),
                    ProfitMargin = rev > 0 ? Math.Round((rev - cost) / rev * 100, 1) : 0
                };
            })
            .OrderByDescending(p => p.TotalRevenue)
            .ToList();

        var byCategory = items
            .GroupBy(i => new { i.CategoryId, i.CategoryName })
            .Select(g =>
            {
                var catProductIds = g.Select(x => x.ProductId).ToHashSet();
                var catReturns = returnItems.Where(r => catProductIds.Contains(r.ProductId)).ToList();
                var retRefund = catReturns.Sum(r => r.Refund);
                var retCost = catReturns.Sum(r => r.Cost);
                var retQty = catReturns.Sum(r => r.Quantity);

                var rev = Math.Max(0m, g.Sum(x => x.Revenue) - retRefund);
                var cost = Math.Max(0m, g.Sum(x => x.Cost) - retCost);
                var qty = Math.Max(0, g.Sum(x => x.Quantity) - retQty);

                return new SalesByCategoryRow
                {
                    CategoryId = g.Key.CategoryId,
                    CategoryName = g.Key.CategoryName,
                    ProductCount = catProductIds.Count,
                    QuantitySold = qty,
                    TotalRevenue = Math.Round(rev, 2),
                    TotalCost = Math.Round(cost, 2),
                    Profit = Math.Round(rev - cost, 2)
                };
            })
            .OrderByDescending(c => c.TotalRevenue)
            .ToList();

        var totalSales = Math.Max(0m, items.Sum(i => i.Revenue) - returnItems.Sum(r => r.Refund));

        return Result<SalesReportDto>.Success(new SalesReportDto
        {
            FromDate = from,
            ToDate = request.ToDate.Date,
            TotalSales = Math.Round(totalSales, 2),
            TotalInvoices = await _db.Invoices
                .CountAsync(i => !i.IsVoided && i.CreatedAt >= from && i.CreatedAt < to, ct),
            AverageInvoiceAmount = byProduct.Count > 0
                ? Math.Round(totalSales / Math.Max(1, await _db.Invoices.CountAsync(i => !i.IsVoided && i.CreatedAt >= from && i.CreatedAt < to, ct)), 2)
                : 0,
            ByProduct = byProduct,
            ByCategory = byCategory
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 3. STOCK MOVEMENT REPORT
// ═══════════════════════════════════════════════════════════════
public class GetStockMovementReportQueryHandler
    : IRequestHandler<GetStockMovementReportQuery, Result<StockMovementReportDto>>
{
    private readonly IAppDbContext _db;
    public GetStockMovementReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<StockMovementReportDto>> Handle(
        GetStockMovementReportQuery request, CancellationToken ct)
    {
        var from = request.FromDate.Date;
        var to = request.ToDate.Date.AddDays(1);

        var query = _db.StockMovements
            .Where(sm => !sm.IsVoided && sm.MovementDate >= from && sm.MovementDate < to);

        if (request.ProductId.HasValue)
            query = query.Where(sm => sm.ProductId == request.ProductId.Value);

        var movements = await query
            .OrderByDescending(sm => sm.MovementDate)
            .Select(sm => new StockMovementRow
            {
                ProductId = sm.ProductId,
                ProductName = sm.Product.NameAr,
                Barcode = sm.Product.Barcode,
                MovementType = sm.Type.ToString(),
                Quantity = sm.Quantity,
                MovementDate = sm.MovementDate,
                CurrentStock = sm.Product.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity)
            })
            .ToListAsync(ct);

        var typeSums = movements.GroupBy(m => m.MovementType).ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

        return Result<StockMovementReportDto>.Success(new StockMovementReportDto
        {
            FromDate = from,
            ToDate = request.ToDate.Date,
            TotalMovements = movements.Count,
            TotalPurchaseQty = typeSums.GetValueOrDefault("Purchase"),
            TotalSaleQty = typeSums.GetValueOrDefault("Sale"),
            TotalReturnQty = typeSums.GetValueOrDefault("Return"),
            TotalDamageQty = typeSums.GetValueOrDefault("Damage"),
            TotalAdjustmentQty = typeSums.GetValueOrDefault("Adjustment"),
            Movements = movements
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 4. EXPENSES & SALARY ADVANCES REPORT
// ═══════════════════════════════════════════════════════════════
public class GetExpensesReportQueryHandler
    : IRequestHandler<GetExpensesReportQuery, Result<ExpensesReportDto>>
{
    private readonly IAppDbContext _db;
    public GetExpensesReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<ExpensesReportDto>> Handle(
        GetExpensesReportQuery request, CancellationToken ct)
    {
        var from = request.FromDate.Date;
        var to = request.ToDate.Date.AddDays(1);

        var expenses = await _db.CashDrawerTransactions
            .Where(c => c.Type == CashDrawerTransactionType.Expense
                        && c.TransactionDate >= from && c.TransactionDate < to)
            .OrderByDescending(c => c.TransactionDate)
            .Select(c => new ExpenseRow
            {
                Id = c.Id,
                Date = c.TransactionDate,
                Amount = Math.Abs(c.Amount),
                Notes = c.Notes
            })
            .ToListAsync(ct);

        var advances = await _db.SalaryAdvances
            .Where(s => s.AdvanceDate >= from && s.AdvanceDate < to)
            .OrderByDescending(s => s.AdvanceDate)
            .Select(s => new SalaryAdvanceRow
            {
                Id = s.Id,
                EmployeeName = s.Employee.Name,
                Amount = s.Amount,
                AdvanceDate = s.AdvanceDate,
                Status = s.Status.ToString(),
                Notes = s.Notes
            })
            .ToListAsync(ct);

        var totalExpenses = expenses.Sum(e => e.Amount);
        var totalAdvances = advances.Sum(a => a.Amount);

        return Result<ExpensesReportDto>.Success(new ExpensesReportDto
        {
            FromDate = from,
            ToDate = request.ToDate.Date,
            TotalExpenses = totalExpenses,
            TotalSalaryAdvances = totalAdvances,
            GrandTotal = totalExpenses + totalAdvances,
            Expenses = expenses,
            SalaryAdvances = advances
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 5. BEST-SELLING PRODUCTS
// ═══════════════════════════════════════════════════════════════
public class GetBestSellingReportQueryHandler
    : IRequestHandler<GetBestSellingReportQuery, Result<BestSellingReportDto>>
{
    private readonly IAppDbContext _db;
    public GetBestSellingReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<BestSellingReportDto>> Handle(
        GetBestSellingReportQuery request, CancellationToken ct)
    {
        var from = request.FromDate.Date;
        var to = request.ToDate.Date.AddDays(1);

        var items = await _db.InvoiceItems
            .Where(ii => !ii.Invoice.IsVoided && ii.Invoice.CreatedAt >= from && ii.Invoice.CreatedAt < to)
            .Select(ii => new
            {
                ii.ProductId,
                ProductName = ii.Product.NameAr,
                Barcode = ii.Product.Barcode,
                CategoryName = ii.Product.Category.NameAr,
                ii.InvoiceId,
                ii.Quantity,
                Revenue = ii.Quantity * ii.UnitPriceAtSale * (1m - ii.DiscountPercentage / 100m),
                Cost = ii.BaseQuantity * ii.UnitCostAtSale
            })
            .ToListAsync(ct);

        var products = items
            .GroupBy(i => new { i.ProductId, i.ProductName, i.Barcode, i.CategoryName })
            .Select(g =>
            {
                var rev = g.Sum(x => x.Revenue);
                var cost = g.Sum(x => x.Cost);
                return new BestSellingProductRow
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    Barcode = g.Key.Barcode,
                    CategoryName = g.Key.CategoryName,
                    QuantitySold = g.Sum(x => x.Quantity),
                    TotalRevenue = Math.Round(rev, 2),
                    Profit = Math.Round(rev - cost, 2),
                    InvoiceAppearances = g.Select(x => x.InvoiceId).Distinct().Count()
                };
            })
            .OrderByDescending(p => p.QuantitySold)
            .Take(request.Top)
            .ToList();

        for (var i = 0; i < products.Count; i++)
            products[i].Rank = i + 1;

        return Result<BestSellingReportDto>.Success(new BestSellingReportDto
        {
            FromDate = from,
            ToDate = request.ToDate.Date,
            Products = products
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// 6. INVENTORY ALERTS (Low Stock + Near Expiry)
// ═══════════════════════════════════════════════════════════════
public class GetInventoryAlertsReportQueryHandler
    : IRequestHandler<GetInventoryAlertsReportQuery, Result<InventoryAlertsReportDto>>
{
    private readonly IAppDbContext _db;
    public GetInventoryAlertsReportQueryHandler(IAppDbContext db) => _db = db;

    public async Task<Result<InventoryAlertsReportDto>> Handle(
        GetInventoryAlertsReportQuery request, CancellationToken ct)
    {
        var threshold = request.LowStockThreshold;
        var expiryDate = DateTime.UtcNow.AddDays(request.NearExpiryDays);
        var now = DateTime.UtcNow;

        // Low stock products
        var products = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new
            {
                p.Id,
                p.NameAr,
                p.Barcode,
                CategoryName = p.Category.NameAr,
                Stock = p.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity)
            })
            .ToListAsync(ct);

        var lowStock = products
            .Where(p => p.Stock <= threshold)
            .Select(p => new LowStockProductRow
            {
                ProductId = p.Id,
                ProductName = p.NameAr,
                Barcode = p.Barcode,
                CategoryName = p.CategoryName,
                CurrentStock = p.Stock,
                StockStatus = p.Stock == 0 ? "OutOfStock" : p.Stock <= 3 ? "Critical" : "Low"
            })
            .OrderBy(p => p.CurrentStock)
            .ToList();

        // Near-expiry batches
        var nearExpiry = await _db.Batches
            .Where(b => b.Quantity > 0 && b.ExpiryDate <= expiryDate)
            .OrderBy(b => b.ExpiryDate)
            .Select(b => new NearExpiryBatchRow
            {
                BatchId = b.Id,
                ProductId = b.ProductId,
                ProductName = b.Product.NameAr,
                Barcode = b.Product.Barcode,
                Quantity = b.Quantity,
                ExpiryDate = b.ExpiryDate,
                DaysUntilExpiry = (int)(b.ExpiryDate - now).TotalDays,
                ExpiryStatus = b.ExpiryDate < now ? "Expired" : (b.ExpiryDate - now).TotalDays <= 7 ? "Critical" : "Warning"
            })
            .ToListAsync(ct);

        return Result<InventoryAlertsReportDto>.Success(new InventoryAlertsReportDto
        {
            LowStockCount = lowStock.Count(p => p.StockStatus != "OutOfStock"),
            OutOfStockCount = lowStock.Count(p => p.StockStatus == "OutOfStock"),
            NearExpiryCount = nearExpiry.Count(b => b.ExpiryStatus != "Expired"),
            ExpiredCount = nearExpiry.Count(b => b.ExpiryStatus == "Expired"),
            LowStockProducts = lowStock,
            NearExpiryBatches = nearExpiry
        });
    }
}

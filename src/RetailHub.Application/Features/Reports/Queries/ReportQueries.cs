using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Reports.DTOs;

namespace RetailHub.Application.Features.Reports.Queries;

// ── 1. Profit & Loss ──
public record GetProfitLossReportQuery(
    DateTime FromDate,
    DateTime ToDate,
    string Granularity = "daily" // daily | weekly | monthly
) : IRequest<Result<ProfitLossReportDto>>;

// ── 2. Sales Report ──
public record GetSalesReportQuery(
    DateTime FromDate,
    DateTime ToDate
) : IRequest<Result<SalesReportDto>>;

// ── 3. Stock Movement Report ──
public record GetStockMovementReportQuery(
    DateTime FromDate,
    DateTime ToDate,
    Guid? ProductId = null
) : IRequest<Result<StockMovementReportDto>>;

// ── 4. Expenses Report ──
public record GetExpensesReportQuery(
    DateTime FromDate,
    DateTime ToDate
) : IRequest<Result<ExpensesReportDto>>;

// ── 5. Best-Selling Products ──
public record GetBestSellingReportQuery(
    DateTime FromDate,
    DateTime ToDate,
    int Top = 20
) : IRequest<Result<BestSellingReportDto>>;

// ── 6. Inventory Alerts (Near-Expiry + Low-Stock) ──
public record GetInventoryAlertsReportQuery(
    int LowStockThreshold = 10,
    int NearExpiryDays = 30
) : IRequest<Result<InventoryAlertsReportDto>>;

using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Reports.DTOs;
using RetailHub.Application.Features.Reports.Queries;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Profit & Loss report with configurable granularity (daily/weekly/monthly).
    /// </summary>
    [HttpGet("profit-loss")]
    [ProducesResponseType(typeof(ApiResponse<ProfitLossReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfitLoss(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] string granularity = "daily",
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetProfitLossReportQuery(fromDate, toDate, granularity), ct);
        return result.IsSuccess
            ? Ok(new ApiResponse<ProfitLossReportDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Sales report grouped by product and category.
    /// </summary>
    [HttpGet("sales")]
    [ProducesResponseType(typeof(ApiResponse<SalesReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSales(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetSalesReportQuery(fromDate, toDate), ct);
        return result.IsSuccess
            ? Ok(new ApiResponse<SalesReportDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Stock movement report with optional product filter.
    /// </summary>
    [HttpGet("stock-movements")]
    [ProducesResponseType(typeof(ApiResponse<StockMovementReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockMovements(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] Guid? productId = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetStockMovementReportQuery(fromDate, toDate, productId), ct);
        return result.IsSuccess
            ? Ok(new ApiResponse<StockMovementReportDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Expenses and salary advances report.
    /// </summary>
    [HttpGet("expenses")]
    [ProducesResponseType(typeof(ApiResponse<ExpensesReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpenses(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetExpensesReportQuery(fromDate, toDate), ct);
        return result.IsSuccess
            ? Ok(new ApiResponse<ExpensesReportDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Top-selling products report.
    /// </summary>
    [HttpGet("best-selling")]
    [ProducesResponseType(typeof(ApiResponse<BestSellingReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBestSelling(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] int top = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetBestSellingReportQuery(fromDate, toDate, top), ct);
        return result.IsSuccess
            ? Ok(new ApiResponse<BestSellingReportDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Inventory alerts: low-stock and near-expiry products.
    /// </summary>
    [HttpGet("inventory-alerts")]
    [ProducesResponseType(typeof(ApiResponse<InventoryAlertsReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventoryAlerts(
        [FromQuery] int lowStockThreshold = 10,
        [FromQuery] int nearExpiryDays = 30,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetInventoryAlertsReportQuery(lowStockThreshold, nearExpiryDays), ct);
        return result.IsSuccess
            ? Ok(new ApiResponse<InventoryAlertsReportDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

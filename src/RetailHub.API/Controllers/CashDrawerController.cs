using Microsoft.AspNetCore.Authorization;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.CashDrawer.Commands.RecordTransaction;
using RetailHub.Application.Features.CashDrawer.Queries.GetDailySummary;
using RetailHub.Application.Features.CashDrawer.Queries.GetTransactions;

namespace RetailHub.API.Controllers;

[Authorize]
[ApiController]
[Route("api/cash-drawer")]
public class CashDrawerController : ControllerBase
{
    private readonly IMediator _mediator;
    public CashDrawerController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Records a cash drawer transaction (Sale, Return, SalaryAdvance, Expense).
    /// </summary>
    [HttpPost("transactions")]
    public async Task<IActionResult> RecordTransaction(
        [FromBody] RecordCashDrawerTransactionCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (result.ValidationErrors.Count > 0)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = result.Error,
                Errors = result.ValidationErrors
            });

        return result.IsSuccess
            ? Created(string.Empty,
                new ApiResponse<Guid> { Success = true, Data = result.Value! })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Returns paginated cash drawer transactions for a specific date.
    /// </summary>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] DateTime date,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetCashDrawerTransactionsQuery(date, page, pageSize),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Returns the daily cash drawer summary (opening balance, inflows, outflows, closing balance).
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetDailySummary(
        [FromQuery] DateTime date,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetDailySummaryQuery(date), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

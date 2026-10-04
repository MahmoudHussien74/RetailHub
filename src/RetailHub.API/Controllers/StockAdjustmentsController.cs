using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.StockAdjustments.Commands.AdjustStock;
using RetailHub.Application.Features.StockAdjustments.DTOs;
using RetailHub.Application.Features.StockAdjustments.Queries.GetStockAdjustments;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/stock-adjustments")]
public class StockAdjustmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public StockAdjustmentsController(IMediator mediator) => _mediator = mediator;

    /// <summary>Write-off / stock-take history with a loss summary.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<StockAdjustmentListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetStockAdjustmentsQuery(page, pageSize, from, to), ct);
        return result.IsSuccess
            ? Ok(new ApiResponse<StockAdjustmentListDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>Remove damaged / expired / lost units from a batch (quantity in base units).</summary>
    [HttpPost("write-off")]
    public Task<IActionResult> WriteOff([FromBody] AdjustStockRequest request, CancellationToken ct = default) =>
        Send(request, StockAdjustmentKind.WriteOff, ct);

    /// <summary>Stock-take: set a batch to the physically counted quantity (base units).</summary>
    [HttpPost("count")]
    public Task<IActionResult> Count([FromBody] AdjustStockRequest request, CancellationToken ct = default) =>
        Send(request, StockAdjustmentKind.Count, ct);

    private async Task<IActionResult> Send(AdjustStockRequest request, StockAdjustmentKind kind, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new AdjustStockCommand(request.ProductId, request.BatchId, kind, request.Quantity, request.Reason ?? string.Empty), ct);

        if (result.ValidationErrors.Count > 0)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = result.Error,
                Errors = result.ValidationErrors
            });

        return result.IsSuccess
            ? Ok(new ApiResponse<Guid> { Success = true, Data = result.Value!, Message = "تمت التسوية بنجاح" })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

public record AdjustStockRequest(Guid ProductId, Guid BatchId, int Quantity, string? Reason);

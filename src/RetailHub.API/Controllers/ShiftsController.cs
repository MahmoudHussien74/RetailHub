using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Shifts.Commands.CloseShift;
using RetailHub.Application.Features.Shifts.Commands.StartShift;
using RetailHub.Application.Features.Shifts.DTOs;
using RetailHub.Application.Features.Shifts.Queries.GetCurrentShift;
using RetailHub.Application.Features.Shifts.Queries.GetShiftById;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/shifts")]
public class ShiftsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShiftsController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Starts a new cashier shift.
    /// </summary>
    [HttpPost("start")]
    public async Task<IActionResult> StartShift(
        [FromBody] StartShiftCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return result.IsSuccess
            ? Ok(new ApiResponse<ShiftDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Closes a cashier shift, calculates expected balance, shortage/surplus, and stores the result.
    /// </summary>
    [HttpPost("close")]
    public async Task<IActionResult> CloseShift(
        [FromBody] CloseShiftCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return result.IsSuccess
            ? Ok(new ApiResponse<ShiftDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Gets the current active shift or the most recent shift status.
    /// </summary>
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentShift(
        [FromQuery] Guid? cashierId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetCurrentShiftQuery(cashierId), cancellationToken);
        return result.IsSuccess
            ? Ok(new ApiResponse<ShiftDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Gets shift details by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetShiftById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetShiftByIdQuery(id), cancellationToken);
        return result.IsSuccess
            ? Ok(new ApiResponse<ShiftDto> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

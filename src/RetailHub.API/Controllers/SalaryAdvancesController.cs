using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.SalaryAdvances.Commands.MarkDeducted;
using RetailHub.Application.Features.SalaryAdvances.Commands.RecordAdvance;
using RetailHub.Application.Features.SalaryAdvances.Queries.GetAdvancesByEmployee;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalaryAdvancesController : ControllerBase
{
    private readonly IMediator _mediator;
    public SalaryAdvancesController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Records a new salary advance for an employee.
    /// Optionally deducts from the cash drawer.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Record(
        [FromBody] RecordAdvanceCommand command,
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
    /// Marks a salary advance as deducted from the employee's salary.
    /// </summary>
    [HttpPatch("{advanceId:guid}/deduct")]
    public async Task<IActionResult> MarkDeducted(
        Guid advanceId,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new MarkAdvanceDeductedCommand(advanceId), cancellationToken);

        return result.IsSuccess
            ? NoContent()
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Returns paginated salary advances, optionally filtered by employee.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? employeeId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetAdvancesByEmployeeQuery(employeeId, page, pageSize),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Returns paginated salary advances for an employee.
    /// </summary>
    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(
        Guid employeeId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetAdvancesByEmployeeQuery(employeeId, page, pageSize),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Suppliers.Commands.CreateSupplier;
using RetailHub.Application.Features.Suppliers.Commands.UpdateSupplier;
using RetailHub.Application.Features.Suppliers.Queries.GetSupplierById;
using RetailHub.Application.Features.Suppliers.Queries.GetSuppliers;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly IMediator _mediator;
    public SuppliersController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateSupplierCommand command,
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
            ? CreatedAtAction(nameof(GetById), new { id = result.Value },
                new ApiResponse<Guid> { Success = true, Data = result.Value! })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateSupplierCommand command,
        CancellationToken cancellationToken = default)
    {
        if (id != command.Id)
            return BadRequest(new ApiResponse<object> { Success = false, Message = "Route ID and body ID mismatch." });

        var result = await _mediator.Send(command, cancellationToken);

        if (result.ValidationErrors.Count > 0)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = result.Error,
                Errors = result.ValidationErrors
            });

        return result.IsSuccess
            ? NoContent()
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetSuppliersQuery(page, pageSize, search, isActive),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetSupplierByIdQuery(id), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

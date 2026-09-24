using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Returns.Commands.CreateReturnInvoice;
using RetailHub.Application.Features.Returns.DTOs;
using RetailHub.Application.Features.Returns.Queries.GetReturnInvoiceById;
using RetailHub.Application.Features.Returns.Queries.GetReturnInvoices;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReturnInvoicesController : ControllerBase
{
    private readonly IMediator _mediator;
    public ReturnInvoicesController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Creates a return invoice — restores stock for sellable items, records damage for damaged items.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateReturnRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CreateReturnInvoiceCommand(
            request.OriginalInvoiceId,
            request.Items);

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

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? originalInvoiceId = null,
        [FromQuery] Guid? customerId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetReturnInvoicesQuery(page, pageSize, originalInvoiceId, customerId),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetReturnInvoiceByIdQuery(id), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

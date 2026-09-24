using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Invoices.Commands.CreateSaleInvoice;
using RetailHub.Application.Features.Invoices.Commands.VoidInvoice;
using RetailHub.Application.Features.Invoices.DTOs;
using RetailHub.Application.Features.Invoices.Queries.GetInvoiceById;
using RetailHub.Application.Features.Invoices.Queries.GetInvoices;
using RetailHub.Domain.Enums;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IMediator _mediator;
    public InvoicesController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Creates a new sale invoice with automatic FEFO batch selection.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateSaleRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CreateSaleInvoiceCommand(
            request.Items,
            request.AmountPaid,
            request.CustomerId);

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

    /// <summary>
    /// Returns paginated list of invoices with optional filters.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] PaymentStatus? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] bool? isVoided = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetInvoicesQuery(page, pageSize, status, fromDate, toDate, isVoided),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Returns invoice details with all items.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetInvoiceByIdQuery(id), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Voids an invoice — restores stock and creates reversal movements.
    /// </summary>
    [HttpPost("{id:guid}/void")]
    public async Task<IActionResult> Void(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new VoidInvoiceCommand(id), cancellationToken);

        return result.IsSuccess
            ? NoContent()
            : result.Error?.Contains("not found") == true
                ? NotFound(new ApiResponse<object> { Success = false, Message = result.Error })
                : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

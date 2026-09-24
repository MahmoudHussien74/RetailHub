using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Purchases.Commands.CreatePurchaseInvoice;
using RetailHub.Application.Features.Purchases.DTOs;
using RetailHub.Application.Features.Purchases.Queries.GetPurchaseInvoiceById;
using RetailHub.Application.Features.Purchases.Queries.GetPurchaseInvoices;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchaseInvoicesController : ControllerBase
{
    private readonly IMediator _mediator;
    public PurchaseInvoicesController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Creates a purchase invoice — automatically creates Batches and recalculates AverageCost.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePurchaseRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CreatePurchaseInvoiceCommand(
            request.SupplierId,
            request.PurchaseDate,
            request.Notes,
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
        [FromQuery] Guid? supplierId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetPurchaseInvoicesQuery(page, pageSize, supplierId, fromDate, toDate),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetPurchaseInvoiceByIdQuery(id), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

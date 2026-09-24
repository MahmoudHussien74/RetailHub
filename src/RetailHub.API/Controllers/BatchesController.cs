using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Batches.Commands.AddBatch;
using RetailHub.Application.Features.Batches.DTOs;
using RetailHub.Application.Features.Batches.Queries.GetBatchesByProduct;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/batches")]
public class BatchesController : ControllerBase
{
    private readonly IMediator _mediator;

    public BatchesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetByProduct(
        Guid productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetBatchesByProductQuery(productId, page, pageSize), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    [HttpPost]
    public async Task<IActionResult> AddBatch(
        [FromRoute] Guid productId,
        [FromBody] AddBatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AddBatchCommand(
            productId,
            request.WarehouseId,
            request.PurchasePrice,
            request.Quantity,
            request.ExpiryDate,
            request.SupplierId);

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
}

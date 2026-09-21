using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Batches.Commands.AddBatch;
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
        [FromQuery] int pageSize = 10)
    {
        var result = await _mediator.Send(new GetBatchesByProductQuery(productId, page, pageSize));

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    [HttpPost]
    public async Task<IActionResult> AddBatch(Guid productId, [FromBody] AddBatchCommand command)
    {
        // Ensure route productId matches command body
        if (productId != command.ProductId)
            return BadRequest(new ApiResponse<object> { Success = false, Message = "Route ProductId and body ProductId mismatch." });

        var result = await _mediator.Send(command);

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

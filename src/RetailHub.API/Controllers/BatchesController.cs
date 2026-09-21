using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using RetailHub.API.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Batches.Commands.AddBatch;
using RetailHub.Application.Features.Batches.Queries.GetBatchesByProduct;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/batches")]
public class BatchesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IStringLocalizer<Messages> _localizer;

    public BatchesController(IMediator mediator, IStringLocalizer<Messages> localizer)
    {
        _mediator = mediator;
        _localizer = localizer;
    }

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
        Guid productId,
        [FromBody] AddBatchCommand command,
        CancellationToken cancellationToken = default)
    {
        if (productId != command.ProductId)
            return BadRequest(new ApiResponse<object> { Success = false, Message = _localizer[MessageKeys.RouteIdMismatch] });

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

using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Warehouses.Queries.GetDefaultWarehouse;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly IMediator _mediator;

    public WarehousesController(IMediator mediator) => _mediator = mediator;

    [HttpGet("default")]
    public async Task<IActionResult> GetDefault(CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetDefaultWarehouseQuery(), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

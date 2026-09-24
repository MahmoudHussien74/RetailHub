using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Products.Commands.CreateProduct;
using RetailHub.Application.Features.Products.Commands.DeactivateProduct;
using RetailHub.Application.Features.Products.Commands.UpdateProduct;
using RetailHub.Application.Features.Products.DTOs;
using RetailHub.Application.Features.Products.Queries.GetProductByBarcode;
using RetailHub.Application.Features.Products.Queries.GetProductById;
using RetailHub.Application.Features.Products.Queries.GetProducts;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ProductsController(IMediator mediator) => _mediator = mediator;
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetProductsQuery(page, pageSize, search), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetProductByIdQuery(id), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetProductByBarcodeQuery(barcode), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductCommand command,
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
        [FromRoute] Guid id,
        [FromBody] UpdateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateProductCommand(
            id,
            request.NameAr,
            request.NameEn,
            request.CategoryId,
            request.BrandId);

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
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new DeactivateProductCommand(id), cancellationToken);

        return result.IsSuccess
            ? NoContent()
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

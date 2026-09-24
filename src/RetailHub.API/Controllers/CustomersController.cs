using MediatR;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Customers.Commands.CreateCustomer;
using RetailHub.Application.Features.Customers.Commands.UpdateCustomer;
using RetailHub.Application.Features.Customers.Queries.GetCustomerById;
using RetailHub.Application.Features.Customers.Queries.GetCustomers;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly IMediator _mediator;
    public CustomersController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Creates a new customer.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateCustomerCommand command,
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

    /// <summary>
    /// Updates an existing customer.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCustomerCommand command,
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

    /// <summary>
    /// Returns paginated list of customers with optional search.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetCustomersQuery(page, pageSize, search, isActive),
            cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });
    }

    /// <summary>
    /// Returns customer details.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetCustomerByIdQuery(id), cancellationToken);

        return result.IsSuccess
            ? Ok(new ApiResponse<object> { Success = true, Data = result.Value })
            : NotFound(new ApiResponse<object> { Success = false, Message = result.Error });
    }
}

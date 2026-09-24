using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Customers.Commands.CreateCustomer;

public record CreateCustomerCommand(
    string Name,
    string Phone,
    string? Address = null) : IRequest<Result<Guid>>;

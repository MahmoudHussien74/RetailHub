using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Customers.Commands.UpdateCustomer;

public record UpdateCustomerCommand(
    Guid Id,
    string Name,
    string Phone,
    string? Address = null) : IRequest<Result>;

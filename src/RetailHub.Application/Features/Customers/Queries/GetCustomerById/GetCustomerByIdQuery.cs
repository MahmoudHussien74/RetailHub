using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Customers.DTOs;

namespace RetailHub.Application.Features.Customers.Queries.GetCustomerById;

public record GetCustomerByIdQuery(Guid Id) : IRequest<Result<CustomerDetailDto>>;

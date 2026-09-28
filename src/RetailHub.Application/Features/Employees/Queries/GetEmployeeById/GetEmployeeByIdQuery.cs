using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Employees.DTOs;

namespace RetailHub.Application.Features.Employees.Queries.GetEmployeeById;

public record GetEmployeeByIdQuery(Guid Id) : IRequest<Result<EmployeeDetailDto>>;

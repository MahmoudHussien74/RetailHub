using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Employees.DTOs;

namespace RetailHub.Application.Features.Employees.Queries.GetEmployees;

public record GetEmployeesQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    bool? IsActive = null) : IRequest<Result<PagedResult<EmployeeListDto>>>;

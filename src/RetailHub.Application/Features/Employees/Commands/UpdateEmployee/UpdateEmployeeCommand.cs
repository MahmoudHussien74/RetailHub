using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Employees.Commands.UpdateEmployee;

public record UpdateEmployeeCommand(
    Guid Id,
    string Name,
    decimal BaseSalary,
    string? Phone,
    string? Role) : IRequest<Result>;

using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Employees.Commands.CreateEmployee;

public record CreateEmployeeCommand(
    string Name,
    decimal BaseSalary,
    string? Phone,
    string? Role) : IRequest<Result<Guid>>;

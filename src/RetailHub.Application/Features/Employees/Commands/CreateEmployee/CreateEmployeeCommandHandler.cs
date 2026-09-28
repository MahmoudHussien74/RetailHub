using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.Employees.Commands.CreateEmployee;

public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateEmployeeCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Guid>> Handle(CreateEmployeeCommand request, CancellationToken ct)
    {
        var employee = Employee.Create(
            request.Name,
            request.BaseSalary,
            request.Phone,
            request.Role);

        await _unitOfWork.Employees.AddAsync(employee, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(employee.Id);
    }
}

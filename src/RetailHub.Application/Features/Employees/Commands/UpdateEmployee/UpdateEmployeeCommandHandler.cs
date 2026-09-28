using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Employees.Commands.UpdateEmployee;

public class UpdateEmployeeCommandHandler : IRequestHandler<UpdateEmployeeCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public UpdateEmployeeCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(UpdateEmployeeCommand request, CancellationToken ct)
    {
        var employee = await _unitOfWork.Employees.GetByIdAsync(request.Id, ct);

        if (employee is null)
            return Result.Failure(_localizer[MessageKeys.EmployeeNotFound]);

        employee.Update(request.Name, request.BaseSalary, request.Phone, request.Role);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}

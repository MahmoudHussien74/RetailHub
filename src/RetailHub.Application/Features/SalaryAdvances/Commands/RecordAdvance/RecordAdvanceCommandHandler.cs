using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.SalaryAdvances.Commands.RecordAdvance;

public class RecordAdvanceCommandHandler : IRequestHandler<RecordAdvanceCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public RecordAdvanceCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(RecordAdvanceCommand request, CancellationToken ct)
    {
        if (!await _unitOfWork.Employees.ExistsAsync(request.EmployeeId, ct))
            return Result<Guid>.Failure(_localizer[MessageKeys.EmployeeNotFound]);

        var advance = SalaryAdvance.Create(request.EmployeeId, request.Amount, request.Notes);
        await _unitOfWork.SalaryAdvances.AddAsync(advance, ct);

        // If taken from cash drawer, record the outflow transaction
        if (request.DeductFromCashDrawer)
        {
            var drawerTx = CashDrawerTransaction.Create(
                CashDrawerTransactionType.SalaryAdvance,
                -request.Amount, // negative = cash outflow
                advance.Id,
                request.Notes);

            await _unitOfWork.CashDrawerTransactions.AddAsync(drawerTx, ct);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(advance.Id);
    }
}

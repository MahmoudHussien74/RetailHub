using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Shifts.DTOs;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Shifts.Commands.StartShift;

public class StartShiftCommandHandler : IRequestHandler<StartShiftCommand, Result<ShiftDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public StartShiftCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<ShiftDto>> Handle(StartShiftCommand request, CancellationToken ct)
    {
        var activeShift = await _unitOfWork.Shifts.GetActiveShiftAsync(request.CashierId, ct);
        if (activeShift is not null)
        {
            return Result<ShiftDto>.Failure("يوجد وردية مفتوحة بالفعل لهذا الكاشير.");
        }

        var shift = Shift.Start(
            request.CashierName,
            request.OpeningBalance,
            request.CashierId,
            request.Notes);

        await _unitOfWork.Shifts.AddAsync(shift, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<ShiftDto>.Success(new ShiftDto
        {
            Id = shift.Id,
            CashierId = shift.CashierId,
            CashierName = shift.CashierName,
            StartTime = shift.StartTime,
            EndTime = shift.EndTime,
            IsOpen = shift.IsOpen,
            OpeningBalance = shift.OpeningBalance,
            TotalCashIn = 0m,
            TotalCashOut = 0m,
            ExpectedCash = shift.ExpectedCash,
            ActualCash = null,
            Difference = null,
            Status = ShiftStatus.Open,
            StatusText = "مفتوح",
            TransactionCount = 0,
            Notes = shift.Notes
        });
    }
}

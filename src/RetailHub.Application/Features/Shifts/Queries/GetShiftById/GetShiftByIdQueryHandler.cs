using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Shifts.DTOs;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Shifts.Queries.GetShiftById;

public class GetShiftByIdQueryHandler : IRequestHandler<GetShiftByIdQuery, Result<ShiftDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAppDbContext _context;

    public GetShiftByIdQueryHandler(IUnitOfWork unitOfWork, IAppDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    public async Task<Result<ShiftDto>> Handle(GetShiftByIdQuery request, CancellationToken ct)
    {
        var shift = await _unitOfWork.Shifts.GetByIdAsync(request.Id, ct);
        if (shift is null)
        {
            return Result<ShiftDto>.Failure("الوردية غير موجودة.");
        }

        var diff = shift.Difference ?? 0m;
        var statusText = shift.Status switch
        {
            ShiftStatus.Shortage => $"عجز ({Math.Abs(diff):N2} ج.م)",
            ShiftStatus.Surplus => $"زيادة ({diff:N2} ج.م)",
            ShiftStatus.Match => "مطابق (لا يوجد عجز أو زيادة)",
            ShiftStatus.Open => "مفتوح",
            _ => "غير محدد"
        };

        var txCount = await _context.CashDrawerTransactions
            .CountAsync(t => t.TransactionDate >= shift.StartTime && (!shift.EndTime.HasValue || t.TransactionDate <= shift.EndTime.Value), ct);

        return Result<ShiftDto>.Success(new ShiftDto
        {
            Id = shift.Id,
            CashierId = shift.CashierId,
            CashierName = shift.CashierName,
            StartTime = shift.StartTime,
            EndTime = shift.EndTime,
            IsOpen = shift.IsOpen,
            OpeningBalance = shift.OpeningBalance,
            TotalCashIn = shift.TotalCashIn,
            TotalCashOut = shift.TotalCashOut,
            ExpectedCash = shift.ExpectedCash,
            ActualCash = shift.ActualCash,
            Difference = shift.Difference,
            Status = shift.Status,
            StatusText = statusText,
            TransactionCount = txCount,
            Notes = shift.Notes
        });
    }
}


using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Shifts.DTOs;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Shifts.Commands.CloseShift;

public class CloseShiftCommandHandler : IRequestHandler<CloseShiftCommand, Result<ShiftDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAppDbContext _context;

    public CloseShiftCommandHandler(IUnitOfWork unitOfWork, IAppDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    public async Task<Result<ShiftDto>> Handle(CloseShiftCommand request, CancellationToken ct)
    {
        var shift = await _unitOfWork.Shifts.GetActiveShiftAsync(request.CashierId, ct);
        if (shift is null && !request.CashierId.HasValue)
        {
            // Try any active shift
            shift = await _context.Shifts.Where(s => s.IsOpen).OrderByDescending(s => s.StartTime).FirstOrDefaultAsync(ct);
        }

        bool isNewShift = false;
        if (shift is null)
        {
            isNewShift = true;
            // If no shift was explicitly opened, create one for today to record the closing
            var todayUtc = DateTime.UtcNow.Date;
            var opening = await _context.CashDrawerTransactions
                .Where(t => t.TransactionDate < todayUtc)
                .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

            shift = Shift.Start(
                string.IsNullOrWhiteSpace(request.CashierName) ? "الكاشير" : request.CashierName,
                opening,
                request.CashierId);

            await _unitOfWork.Shifts.AddAsync(shift, ct);
        }

        var transactions = await _context.CashDrawerTransactions
            .Where(t => t.TransactionDate >= shift.StartTime)
            .ToListAsync(ct);

        var totalCashIn = Math.Round(transactions.Where(t => t.Amount > 0).Sum(t => t.Amount), 2, MidpointRounding.AwayFromZero);
        var totalCashOut = Math.Round(transactions.Where(t => t.Amount < 0).Sum(t => Math.Abs(t.Amount)), 2, MidpointRounding.AwayFromZero);

        var totalDiscounts = await _context.Invoices
            .Where(i => !i.IsVoided && i.CreatedAt >= shift.StartTime && i.DiscountAmount > 0)
            .SumAsync(i => (decimal?)i.DiscountAmount, ct) ?? 0m;
        totalDiscounts = Math.Round(totalDiscounts, 2, MidpointRounding.AwayFromZero);

        shift.Close(request.ActualCash, totalCashIn, totalCashOut, request.Notes);

        if (!isNewShift)
        {
            _unitOfWork.Shifts.Update(shift);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        var diff = shift.Difference ?? 0m;
        string statusText = shift.Status switch
        {
            ShiftStatus.Shortage => $"عجز ({Math.Abs(diff):N2} ج.م)",
            ShiftStatus.Surplus => $"زيادة ({diff:N2} ج.م)",
            ShiftStatus.Match => "مطابق (لا يوجد عجز أو زيادة)",
            _ => "غير محدد"
        };

        var dto = new ShiftDto
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
            TotalDiscounts = totalDiscounts,
            TransactionCount = transactions.Count,
            Notes = shift.Notes
        };

        return Result<ShiftDto>.Success(dto);
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Shifts.DTOs;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Shifts.Queries.GetCurrentShift;

public class GetCurrentShiftQueryHandler : IRequestHandler<GetCurrentShiftQuery, Result<ShiftDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAppDbContext _context;

    public GetCurrentShiftQueryHandler(IUnitOfWork unitOfWork, IAppDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    public async Task<Result<ShiftDto>> Handle(GetCurrentShiftQuery request, CancellationToken ct)
    {
        var shift = await _unitOfWork.Shifts.GetActiveShiftAsync(request.CashierId, ct);
        if (shift is null && !request.CashierId.HasValue)
        {
            shift = await _context.Shifts.Where(s => s.IsOpen).OrderByDescending(s => s.StartTime).FirstOrDefaultAsync(ct);
        }

        if (shift is null)
        {
            // If no active shift, check the most recent shift (even if closed) or return a default today shift
            var lastShift = await _context.Shifts.OrderByDescending(s => s.StartTime).FirstOrDefaultAsync(ct);
            if (lastShift is not null)
            {
                var diff = lastShift.Difference ?? 0m;
                var statusText = lastShift.Status switch
                {
                    ShiftStatus.Shortage => $"عجز ({Math.Abs(diff):N2} ج.م)",
                    ShiftStatus.Surplus => $"زيادة ({diff:N2} ج.م)",
                    ShiftStatus.Match => "مطابق (لا يوجد عجز أو زيادة)",
                    ShiftStatus.Open => "مفتوح",
                    _ => "غير محدد"
                };

                return Result<ShiftDto>.Success(new ShiftDto
                {
                    Id = lastShift.Id,
                    CashierId = lastShift.CashierId,
                    CashierName = lastShift.CashierName,
                    StartTime = lastShift.StartTime,
                    EndTime = lastShift.EndTime,
                    IsOpen = lastShift.IsOpen,
                    OpeningBalance = lastShift.OpeningBalance,
                    TotalCashIn = lastShift.TotalCashIn,
                    TotalCashOut = lastShift.TotalCashOut,
                    ExpectedCash = lastShift.ExpectedCash,
                    ActualCash = lastShift.ActualCash,
                    Difference = lastShift.Difference,
                    Status = lastShift.Status,
                    StatusText = statusText,
                    TransactionCount = 0,
                    Notes = lastShift.Notes
                });
            }

            // No shifts ever recorded
            var todayUtc = DateTime.UtcNow.Date;
            var opening = await _context.CashDrawerTransactions
                .Where(t => t.TransactionDate < todayUtc)
                .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

            var todayTransactions = await _context.CashDrawerTransactions
                .Where(t => t.TransactionDate >= todayUtc)
                .ToListAsync(ct);

            var inAmount = Math.Round(todayTransactions.Where(t => t.Amount > 0).Sum(t => t.Amount), 2, MidpointRounding.AwayFromZero);
            var outAmount = Math.Round(todayTransactions.Where(t => t.Amount < 0).Sum(t => Math.Abs(t.Amount)), 2, MidpointRounding.AwayFromZero);
            var expected = Math.Round(opening + inAmount - outAmount, 2, MidpointRounding.AwayFromZero);

            return Result<ShiftDto>.Success(new ShiftDto
            {
                Id = Guid.Empty,
                CashierName = "الكاشير",
                StartTime = todayUtc,
                IsOpen = false,
                OpeningBalance = opening,
                TotalCashIn = inAmount,
                TotalCashOut = outAmount,
                ExpectedCash = expected,
                ActualCash = null,
                Difference = null,
                Status = ShiftStatus.Open,
                StatusText = "لا يوجد وردية نشطة",
                TransactionCount = todayTransactions.Count,
                Notes = null
            });
        }

        // Live calculation for the active shift
        var transactions = await _context.CashDrawerTransactions
            .Where(t => t.TransactionDate >= shift.StartTime)
            .ToListAsync(ct);

        var totalIn = Math.Round(transactions.Where(t => t.Amount > 0).Sum(t => t.Amount), 2, MidpointRounding.AwayFromZero);
        var totalOut = Math.Round(transactions.Where(t => t.Amount < 0).Sum(t => Math.Abs(t.Amount)), 2, MidpointRounding.AwayFromZero);
        var expectedCash = Math.Round(shift.OpeningBalance + totalIn - totalOut, 2, MidpointRounding.AwayFromZero);

        var totalDiscounts = await _context.Invoices
            .Where(i => !i.IsVoided && i.CreatedAt >= shift.StartTime && i.DiscountAmount > 0)
            .SumAsync(i => (decimal?)i.DiscountAmount, ct) ?? 0m;
        totalDiscounts = Math.Round(totalDiscounts, 2, MidpointRounding.AwayFromZero);

        return Result<ShiftDto>.Success(new ShiftDto
        {
            Id = shift.Id,
            CashierId = shift.CashierId,
            CashierName = shift.CashierName,
            StartTime = shift.StartTime,
            EndTime = shift.EndTime,
            IsOpen = shift.IsOpen,
            OpeningBalance = shift.OpeningBalance,
            TotalCashIn = totalIn,
            TotalCashOut = totalOut,
            ExpectedCash = expectedCash,
            ActualCash = shift.ActualCash,
            Difference = shift.Difference,
            Status = shift.Status,
            StatusText = "مفتوح",
            TotalDiscounts = totalDiscounts,
            TransactionCount = transactions.Count,
            Notes = shift.Notes
        });
    }
}

using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Shifts.DTOs;

public class ShiftDto
{
    public Guid Id { get; set; }
    public Guid? CashierId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool IsOpen { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal TotalCashIn { get; set; }
    public decimal TotalCashOut { get; set; }
    public decimal ExpectedCash { get; set; }
    public decimal? ActualCash { get; set; }
    public decimal? Difference { get; set; }
    public ShiftStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public decimal TotalDiscounts { get; set; }
    public int TransactionCount { get; set; }
    public string? Notes { get; set; }
}

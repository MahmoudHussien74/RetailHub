namespace RetailHub.Application.Features.CashDrawer.DTOs;

/// <summary>
/// Daily cash drawer summary — compares expected system balance vs actual cash.
/// OpeningBalance is carried over from the previous day's closing.
/// </summary>
public class DailySummaryDto
{
    public DateTime Date { get; init; }
    public decimal OpeningBalance { get; init; }
    public decimal TotalInflows { get; init; }
    public decimal TotalOutflows { get; init; }
    public decimal ClosingBalance { get; init; }
    public int TransactionCount { get; init; }
}

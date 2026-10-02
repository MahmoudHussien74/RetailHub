using RetailHub.Domain.Common;
using RetailHub.Domain.Enums;

namespace RetailHub.Domain.Entities;

public class Shift : AuditableEntity
{
    public Guid? CashierId { get; private set; }
    public string CashierName { get; private set; } = string.Empty;
    public DateTime StartTime { get; private set; }
    public DateTime? EndTime { get; private set; }
    public bool IsOpen { get; private set; } = true;
    public decimal OpeningBalance { get; private set; }
    public decimal TotalCashIn { get; private set; }
    public decimal TotalCashOut { get; private set; }
    public decimal ExpectedCash { get; private set; }
    public decimal? ActualCash { get; private set; }
    public decimal? Difference { get; private set; }
    public ShiftStatus Status { get; private set; } = ShiftStatus.Open;
    public string? Notes { get; private set; }

    private Shift() { } // EF Core

    public static Shift Start(
        string cashierName,
        decimal openingBalance = 0m,
        Guid? cashierId = null,
        string? notes = null)
    {
        var roundedOpening = Math.Round(openingBalance, 2, MidpointRounding.AwayFromZero);
        return new Shift
        {
            CashierId = cashierId,
            CashierName = cashierName,
            StartTime = DateTime.UtcNow,
            IsOpen = true,
            OpeningBalance = roundedOpening,
            TotalCashIn = 0m,
            TotalCashOut = 0m,
            ExpectedCash = roundedOpening,
            Status = ShiftStatus.Open,
            Notes = notes
        };
    }

    public void Close(
        decimal actualCash,
        decimal totalCashIn,
        decimal totalCashOut,
        string? notes = null)
    {
        var roundedActual = Math.Round(actualCash, 2, MidpointRounding.AwayFromZero);
        var roundedIn = Math.Round(totalCashIn, 2, MidpointRounding.AwayFromZero);
        var roundedOut = Math.Round(totalCashOut, 2, MidpointRounding.AwayFromZero);

        EndTime = DateTime.UtcNow;
        IsOpen = false;
        TotalCashIn = roundedIn;
        TotalCashOut = roundedOut;
        ExpectedCash = Math.Round(OpeningBalance + roundedIn - roundedOut, 2, MidpointRounding.AwayFromZero);
        ActualCash = roundedActual;
        Difference = Math.Round(roundedActual - ExpectedCash, 2, MidpointRounding.AwayFromZero);

        if (Difference.Value < 0m)
            Status = ShiftStatus.Shortage;
        else if (Difference.Value > 0m)
            Status = ShiftStatus.Surplus;
        else
            Status = ShiftStatus.Match;

        if (!string.IsNullOrWhiteSpace(notes))
        {
            Notes = string.IsNullOrWhiteSpace(Notes) ? notes : $"{Notes} | {notes}";
        }
    }
}

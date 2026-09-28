using RetailHub.Domain.Common;
using RetailHub.Domain.Enums;

namespace RetailHub.Domain.Entities;

/// <summary>
/// Tracks salary advances taken by employees.
/// If taken from the cash drawer, a CashDrawerTransaction must also be recorded.
/// Status transitions: Pending → Deducted (when deducted from salary).
/// </summary>
public class SalaryAdvance : AuditableEntity
{
    public Guid EmployeeId { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime AdvanceDate { get; private set; }
    public SalaryAdvanceStatus Status { get; private set; }
    public string? Notes { get; private set; }

    // Navigation
    public Employee Employee { get; private set; } = null!;

    private SalaryAdvance() { } // EF Core

    public static SalaryAdvance Create(Guid employeeId, decimal amount, string? notes = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Advance amount must be positive.", nameof(amount));

        return new SalaryAdvance
        {
            EmployeeId = employeeId,
            Amount = amount,
            AdvanceDate = DateTime.UtcNow,
            Status = SalaryAdvanceStatus.Pending,
            Notes = notes
        };
    }

    /// <summary>
    /// Marks this advance as deducted from the employee's salary.
    /// </summary>
    public void MarkDeducted()
    {
        if (Status == SalaryAdvanceStatus.Deducted)
            throw new InvalidOperationException("Advance is already deducted.");

        Status = SalaryAdvanceStatus.Deducted;
    }
}

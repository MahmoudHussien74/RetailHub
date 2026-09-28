using RetailHub.Domain.Common;
using RetailHub.Domain.Enums;

namespace RetailHub.Domain.Entities;

/// <summary>
/// Unified cash drawer ledger — every actual cash movement is recorded here.
/// Card/electronic payments do NOT create entries in this table.
/// Amount is positive for inflows (Sale), negative for outflows (Return, SalaryAdvance, Expense).
/// ReferenceId links to the source record (Invoice, SalaryAdvance, etc.).
/// </summary>
public class CashDrawerTransaction : AuditableEntity
{
    public DateTime TransactionDate { get; private set; }
    public CashDrawerTransactionType Type { get; private set; }
    public decimal Amount { get; private set; }
    public Guid? ReferenceId { get; private set; }
    public string? Notes { get; private set; }

    private CashDrawerTransaction() { } // EF Core

    public static CashDrawerTransaction Create(
        CashDrawerTransactionType type,
        decimal amount,
        Guid? referenceId = null,
        string? notes = null)
    {
        return new CashDrawerTransaction
        {
            TransactionDate = DateTime.UtcNow,
            Type = type,
            Amount = amount,
            ReferenceId = referenceId,
            Notes = notes
        };
    }
}

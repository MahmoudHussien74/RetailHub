namespace RetailHub.Domain.Enums;

/// <summary>
/// Types of cash drawer transactions.
/// Card/electronic payments do NOT create CashDrawerTransactions — only actual cash movements.
/// </summary>
public enum CashDrawerTransactionType
{
    Sale,
    Return,
    SalaryAdvance,
    Expense
}

namespace RetailHub.Application.Features.CashDrawer.DTOs;

public class CashDrawerTransactionDto
{
    public Guid Id { get; init; }
    public DateTime TransactionDate { get; init; }
    public string Type { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public Guid? ReferenceId { get; init; }
    public string? Notes { get; init; }
}

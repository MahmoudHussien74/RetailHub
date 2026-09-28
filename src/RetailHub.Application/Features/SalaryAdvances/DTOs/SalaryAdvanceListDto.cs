namespace RetailHub.Application.Features.SalaryAdvances.DTOs;

public class SalaryAdvanceListDto
{
    public Guid Id { get; init; }
    public Guid EmployeeId { get; init; }
    public string EmployeeName { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public DateTime AdvanceDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Notes { get; init; }
}

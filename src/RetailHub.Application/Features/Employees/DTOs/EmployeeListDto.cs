namespace RetailHub.Application.Features.Employees.DTOs;

public class EmployeeListDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? Role { get; init; }
    public decimal BaseSalary { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

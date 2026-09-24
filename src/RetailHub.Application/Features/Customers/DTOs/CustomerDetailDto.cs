namespace RetailHub.Application.Features.Customers.DTOs;

public class CustomerDetailDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? Address { get; init; }
    public decimal Balance { get; init; }
    public bool IsActive { get; init; }
    public int InvoiceCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

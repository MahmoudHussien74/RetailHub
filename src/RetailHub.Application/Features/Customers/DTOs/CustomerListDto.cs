namespace RetailHub.Application.Features.Customers.DTOs;

public class CustomerListDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public decimal Balance { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

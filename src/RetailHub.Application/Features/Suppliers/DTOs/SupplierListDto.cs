namespace RetailHub.Application.Features.Suppliers.DTOs;

public class SupplierListDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

namespace RetailHub.Application.Features.Warehouses.DTOs;

public class WarehouseDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Address { get; init; }
    public bool IsDefault { get; init; }
}

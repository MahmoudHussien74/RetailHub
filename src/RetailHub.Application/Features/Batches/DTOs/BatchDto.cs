namespace RetailHub.Application.Features.Batches.DTOs;

public class BatchDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public Guid WarehouseId { get; init; }
    public decimal PurchasePrice { get; init; }
    public int Quantity { get; init; }
    public DateTime ExpiryDate { get; init; }
    public Guid? SupplierId { get; init; }
    public DateTime CreatedAt { get; init; }
}

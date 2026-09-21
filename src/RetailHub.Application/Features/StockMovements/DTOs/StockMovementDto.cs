using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.StockMovements.DTOs;

public class StockMovementDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public Guid BatchId { get; init; }
    public string Type { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public DateTime MovementDate { get; init; }
    public Guid? ReferenceId { get; init; }
    public bool IsVoided { get; init; }
}

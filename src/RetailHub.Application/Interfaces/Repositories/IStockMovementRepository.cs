using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IStockMovementRepository
{
    Task AddAsync(StockMovement movement, CancellationToken ct = default);
}

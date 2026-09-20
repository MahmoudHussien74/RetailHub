using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IBatchRepository
{
    Task<List<Batch>> GetAvailableBatchesByProductIdAsync(Guid productId, CancellationToken ct = default);
    Task<List<Batch>> GetByProductIdOrderedByExpiryAsync(Guid productId, CancellationToken ct = default);
    Task AddAsync(Batch batch, CancellationToken ct = default);
}

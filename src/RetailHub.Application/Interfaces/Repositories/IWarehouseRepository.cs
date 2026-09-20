using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IWarehouseRepository
{
    Task<Warehouse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Warehouse?> GetDefaultAsync(CancellationToken ct = default);
}

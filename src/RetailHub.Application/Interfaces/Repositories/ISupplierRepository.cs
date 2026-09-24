using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface ISupplierRepository
{
    Task<Supplier?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Supplier supplier, CancellationToken ct = default);
    void Update(Supplier supplier);
    Task<bool> ExistsAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(string name, Guid excludeId, CancellationToken ct = default);
}

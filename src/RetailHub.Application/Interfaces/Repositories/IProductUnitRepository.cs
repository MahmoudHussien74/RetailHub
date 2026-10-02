using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IProductUnitRepository
{
    Task<ProductUnit?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ProductUnit?> GetByBarcodeAsync(string barcode, CancellationToken ct = default);
    Task<List<ProductUnit>> GetByProductIdAsync(Guid productId, CancellationToken ct = default);
    Task<ProductUnit?> GetDefaultUnitByProductIdAsync(Guid productId, CancellationToken ct = default);
    Task AddAsync(ProductUnit unit, CancellationToken ct = default);
    void Update(ProductUnit unit);
    void Remove(ProductUnit unit);
}

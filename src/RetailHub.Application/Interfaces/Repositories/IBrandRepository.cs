using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IBrandRepository
{
    Task<Brand?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Brand brand, CancellationToken ct = default);
    void Update(Brand brand);
    Task<bool> ExistsByNameAsync(string nameAr, CancellationToken ct = default);
}

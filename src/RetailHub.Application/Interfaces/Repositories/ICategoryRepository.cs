using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Category category, CancellationToken ct = default);
    void Update(Category category);
    Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default);
}

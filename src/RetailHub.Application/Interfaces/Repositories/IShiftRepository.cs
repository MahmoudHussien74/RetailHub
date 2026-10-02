using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IShiftRepository
{
    Task<Shift?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Shift?> GetActiveShiftAsync(Guid? cashierId = null, CancellationToken ct = default);
    Task AddAsync(Shift shift, CancellationToken ct = default);
    void Update(Shift shift);
}

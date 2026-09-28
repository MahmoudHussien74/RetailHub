using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface ISalaryAdvanceRepository
{
    Task AddAsync(SalaryAdvance advance, CancellationToken ct = default);
    Task<SalaryAdvance?> GetByIdAsync(Guid id, CancellationToken ct = default);
}

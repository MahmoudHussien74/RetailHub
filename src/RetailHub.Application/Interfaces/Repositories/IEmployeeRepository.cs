using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IEmployeeRepository
{
    Task<Employee?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Employee employee, CancellationToken ct = default);
    void Update(Employee employee);
    Task<bool> ExistsAsync(Guid id, CancellationToken ct = default);
}

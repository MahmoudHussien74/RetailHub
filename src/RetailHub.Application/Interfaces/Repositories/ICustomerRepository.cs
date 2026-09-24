using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Customer customer, CancellationToken ct = default);
    void Update(Customer customer);
    Task<bool> ExistsAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsByPhoneAsync(string phone, CancellationToken ct = default);
    Task<bool> ExistsByPhoneAsync(string phone, Guid excludeId, CancellationToken ct = default);
}

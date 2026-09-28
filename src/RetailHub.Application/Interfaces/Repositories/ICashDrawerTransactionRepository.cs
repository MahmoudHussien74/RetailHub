using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface ICashDrawerTransactionRepository
{
    Task AddAsync(CashDrawerTransaction transaction, CancellationToken ct = default);
}

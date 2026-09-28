using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class CashDrawerTransactionRepository : ICashDrawerTransactionRepository
{
    private readonly AppDbContext _context;

    public CashDrawerTransactionRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(CashDrawerTransaction transaction, CancellationToken ct = default) =>
        await _context.Set<CashDrawerTransaction>().AddAsync(transaction, ct);
}

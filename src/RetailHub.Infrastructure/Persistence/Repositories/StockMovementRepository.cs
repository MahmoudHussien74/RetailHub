using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class StockMovementRepository : IStockMovementRepository
{
    private readonly AppDbContext _context;

    public StockMovementRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(StockMovement movement, CancellationToken ct = default) =>
        await _context.StockMovements.AddAsync(movement, ct);
}

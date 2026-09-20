using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class WarehouseRepository : IWarehouseRepository
{
    private readonly AppDbContext _context;

    public WarehouseRepository(AppDbContext context) => _context = context;

    public async Task<Warehouse?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == id, ct);

    public async Task<Warehouse?> GetDefaultAsync(CancellationToken ct = default) =>
        await _context.Warehouses.FirstOrDefaultAsync(w => w.IsDefault, ct);
}

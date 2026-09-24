using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class SupplierRepository : ISupplierRepository
{
    private readonly AppDbContext _context;

    public SupplierRepository(AppDbContext context) => _context = context;

    public async Task<Supplier?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<Supplier>().FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task AddAsync(Supplier supplier, CancellationToken ct = default) =>
        await _context.Set<Supplier>().AddAsync(supplier, ct);

    public void Update(Supplier supplier) =>
        _context.Set<Supplier>().Update(supplier);

    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<Supplier>().AnyAsync(s => s.Id == id, ct);

    public async Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default) =>
        await _context.Set<Supplier>().AnyAsync(s => s.Name == name, ct);

    public async Task<bool> ExistsByNameAsync(string name, Guid excludeId, CancellationToken ct = default) =>
        await _context.Set<Supplier>().AnyAsync(s => s.Name == name && s.Id != excludeId, ct);
}

using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class BrandRepository : IBrandRepository
{
    private readonly AppDbContext _context;

    public BrandRepository(AppDbContext context) => _context = context;

    public async Task<Brand?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Brands.FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task AddAsync(Brand brand, CancellationToken ct = default) =>
        await _context.Brands.AddAsync(brand, ct);

    public void Update(Brand brand) =>
        _context.Brands.Update(brand);

    public async Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default) =>
        await _context.Brands.AnyAsync(b => b.Name == name && b.IsActive, ct);
}

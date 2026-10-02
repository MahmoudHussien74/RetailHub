using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class ProductUnitRepository : IProductUnitRepository
{
    private readonly AppDbContext _context;

    public ProductUnitRepository(AppDbContext context) => _context = context;

    public async Task<ProductUnit?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.ProductUnits.FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<ProductUnit?> GetByBarcodeAsync(string barcode, CancellationToken ct = default) =>
        await _context.ProductUnits.FirstOrDefaultAsync(u => u.Barcode == barcode, ct);

    public async Task<List<ProductUnit>> GetByProductIdAsync(Guid productId, CancellationToken ct = default) =>
        await _context.ProductUnits
            .Where(u => u.ProductId == productId)
            .OrderByDescending(u => u.ConversionFactor)
            .ToListAsync(ct);

    public async Task<ProductUnit?> GetDefaultUnitByProductIdAsync(Guid productId, CancellationToken ct = default) =>
        await _context.ProductUnits
            .Where(u => u.ProductId == productId && u.IsDefaultSale)
            .FirstOrDefaultAsync(ct);

    public async Task AddAsync(ProductUnit unit, CancellationToken ct = default) =>
        await _context.ProductUnits.AddAsync(unit, ct);

    public void Update(ProductUnit unit) =>
        _context.ProductUnits.Update(unit);

    public void Remove(ProductUnit unit) =>
        _context.ProductUnits.Remove(unit);
}

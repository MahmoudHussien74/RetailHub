using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _context;

    public ProductRepository(AppDbContext context) => _context = context;

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Products.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Product?> GetByBarcodeAsync(string barcode, CancellationToken ct = default) =>
        await _context.Products.FirstOrDefaultAsync(p => p.Barcode == barcode, ct);

    public async Task AddAsync(Product product, CancellationToken ct = default) =>
        await _context.Products.AddAsync(product, ct);

    public void Update(Product product) =>
        _context.Products.Update(product);

    public async Task<bool> ExistsAsync(string barcode, CancellationToken ct = default) =>
        await _context.Products.AnyAsync(p => p.Barcode == barcode, ct);

    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default) =>
        await _context.Products.AnyAsync(p => p.Id == id, ct);
}

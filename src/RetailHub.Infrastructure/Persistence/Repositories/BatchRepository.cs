using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class BatchRepository : IBatchRepository
{
    private readonly AppDbContext _context;

    public BatchRepository(AppDbContext context) => _context = context;

    /// <summary>
    /// Returns batches with Quantity > 0, ordered by ExpiryDate ascending (FEFO-ready).
    /// </summary>
    public async Task<List<Batch>> GetAvailableBatchesByProductIdAsync(
        Guid productId, CancellationToken ct = default) =>
        await _context.Batches
            .Where(b => b.ProductId == productId && b.Quantity > 0)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync(ct);

    /// <summary>
    /// Returns all batches for a product ordered by ExpiryDate ascending.
    /// Includes zero-quantity batches (for historical view).
    /// </summary>
    public async Task<List<Batch>> GetByProductIdOrderedByExpiryAsync(
        Guid productId, CancellationToken ct = default) =>
        await _context.Batches
            .Where(b => b.ProductId == productId)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync(ct);

    public async Task AddAsync(Batch batch, CancellationToken ct = default) =>
        await _context.Batches.AddAsync(batch, ct);
}

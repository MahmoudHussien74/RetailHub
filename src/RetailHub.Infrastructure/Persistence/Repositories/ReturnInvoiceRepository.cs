using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class ReturnInvoiceRepository : IReturnInvoiceRepository
{
    private readonly AppDbContext _context;

    public ReturnInvoiceRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(ReturnInvoice returnInvoice, CancellationToken ct = default) =>
        await _context.Set<ReturnInvoice>().AddAsync(returnInvoice, ct);

    public async Task AddReturnItemAsync(ReturnInvoiceItem item, CancellationToken ct = default) =>
        await _context.Set<ReturnInvoiceItem>().AddAsync(item, ct);

    public async Task<ReturnInvoice?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<ReturnInvoice>()
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

    /// <summary>
    /// Gets the total quantity already returned for a specific InvoiceItem.
    /// Aggregates across all ReturnInvoice records to prevent double-returns.
    /// </summary>
    public async Task<int> GetReturnedQuantityByInvoiceItemIdAsync(Guid invoiceItemId, CancellationToken ct = default) =>
        await _context.Set<ReturnInvoiceItem>()
            .Where(ri => ri.InvoiceItemId == invoiceItemId)
            .SumAsync(ri => ri.Quantity, ct);
}

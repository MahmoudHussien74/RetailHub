using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class PurchaseInvoiceRepository : IPurchaseInvoiceRepository
{
    private readonly AppDbContext _context;

    public PurchaseInvoiceRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(PurchaseInvoice invoice, CancellationToken ct = default) =>
        await _context.Set<PurchaseInvoice>().AddAsync(invoice, ct);

    public async Task AddItemAsync(PurchaseInvoiceItem item, CancellationToken ct = default) =>
        await _context.Set<PurchaseInvoiceItem>().AddAsync(item, ct);

    public async Task<PurchaseInvoice?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<PurchaseInvoice>()
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    /// <summary>
    /// Generates sequential purchase number: PUR-0001, PUR-0002, etc.
    /// </summary>
    public async Task<string> GenerateNextPurchaseNumberAsync(CancellationToken ct = default)
    {
        var lastInvoice = await _context.Set<PurchaseInvoice>()
            .OrderByDescending(p => p.InvoiceNumber)
            .Select(p => p.InvoiceNumber)
            .FirstOrDefaultAsync(ct);

        if (lastInvoice is null)
            return "PUR-0001";

        var numericPart = lastInvoice.Replace("PUR-", "");
        if (int.TryParse(numericPart, out var number))
            return $"PUR-{number + 1:D4}";

        return "PUR-0001";
    }
}

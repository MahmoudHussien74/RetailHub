using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class InvoiceRepository : IInvoiceRepository
{
    private readonly AppDbContext _context;

    public InvoiceRepository(AppDbContext context) => _context = context;

    /// <summary>
    /// Write-side: loads Invoice with InvoiceItems for modification (Include allowed per rules).
    /// </summary>
    public async Task<Invoice?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default) =>
        await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

    public async Task AddAsync(Invoice invoice, CancellationToken ct = default) =>
        await _context.Invoices.AddAsync(invoice, ct);

    public async Task AddInvoiceItemAsync(InvoiceItem item, CancellationToken ct = default) =>
        await _context.InvoiceItems.AddAsync(item, ct);

    public void Update(Invoice invoice) =>
        _context.Invoices.Update(invoice);

    /// <summary>
    /// Generates sequential invoice number: INV-0001, INV-0002, etc.
    /// Queries the max existing number and increments.
    /// </summary>
    public async Task<string> GenerateNextInvoiceNumberAsync(CancellationToken ct = default)
    {
        var lastInvoice = await _context.Invoices
            .OrderByDescending(i => i.InvoiceNumber)
            .Select(i => i.InvoiceNumber)
            .FirstOrDefaultAsync(ct);

        if (lastInvoice is null)
            return "INV-0001";

        // Extract numeric part from "INV-XXXX" and increment
        var numericPart = lastInvoice.Replace("INV-", "");
        if (int.TryParse(numericPart, out var number))
            return $"INV-{number + 1:D4}";

        return "INV-0001";
    }
}

using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IInvoiceRepository
{
    /// <summary>
    /// Loads invoice with all InvoiceItems for write-side operations (Include allowed).
    /// </summary>
    Task<Invoice?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default);

    Task AddAsync(Invoice invoice, CancellationToken ct = default);
    Task AddInvoiceItemAsync(InvoiceItem item, CancellationToken ct = default);
    void Update(Invoice invoice);

    /// <summary>
    /// Generates the next sequential invoice number (e.g., INV-0001, INV-0002).
    /// </summary>
    Task<string> GenerateNextInvoiceNumberAsync(CancellationToken ct = default);
}

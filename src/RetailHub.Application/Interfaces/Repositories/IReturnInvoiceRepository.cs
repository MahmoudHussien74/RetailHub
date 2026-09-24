using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IReturnInvoiceRepository
{
    Task AddAsync(ReturnInvoice returnInvoice, CancellationToken ct = default);
    Task AddReturnItemAsync(ReturnInvoiceItem item, CancellationToken ct = default);
    Task<ReturnInvoice?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Gets the total quantity already returned for a specific InvoiceItem across all returns.
    /// Used to prevent double-returns.
    /// </summary>
    Task<int> GetReturnedQuantityByInvoiceItemIdAsync(Guid invoiceItemId, CancellationToken ct = default);
}

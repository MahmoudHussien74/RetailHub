using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces.Repositories;

public interface IPurchaseInvoiceRepository
{
    Task AddAsync(PurchaseInvoice invoice, CancellationToken ct = default);
    Task AddItemAsync(PurchaseInvoiceItem item, CancellationToken ct = default);
    Task<PurchaseInvoice?> GetByIdWithItemsAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Generates the next sequential purchase number (e.g., PUR-0001, PUR-0002).
    /// </summary>
    Task<string> GenerateNextPurchaseNumberAsync(CancellationToken ct = default);
}

using RetailHub.Application.Interfaces.Repositories;

namespace RetailHub.Application.Interfaces;

/// <summary>
/// Aggregates all repositories and exposes a single SaveChangesAsync.
/// Multi-repository operations (e.g., add Batch + update AverageCost)
/// call SaveChangesAsync once at the end of the Handler to ensure atomicity.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IProductRepository Products { get; }
    IBatchRepository Batches { get; }
    IStockMovementRepository StockMovements { get; }
    ICategoryRepository Categories { get; }
    IBrandRepository Brands { get; }
    IWarehouseRepository Warehouses { get; }
    IInvoiceRepository Invoices { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

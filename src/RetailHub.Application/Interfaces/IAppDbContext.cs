using RetailHub.Domain.Entities;

namespace RetailHub.Application.Interfaces;

/// <summary>
/// Read-only DbContext abstraction for Query handlers.
/// Query handlers use this to perform Projection queries (ProjectToType/Select)
/// with AsNoTracking, while Command handlers use IUnitOfWork + Repositories.
/// Defined in Application layer — implemented by AppDbContext in Infrastructure.
/// </summary>
public interface IAppDbContext
{
    IQueryable<Product> Products { get; }
    IQueryable<Category> Categories { get; }
    IQueryable<Brand> Brands { get; }
    IQueryable<Warehouse> Warehouses { get; }
    IQueryable<Batch> Batches { get; }
    IQueryable<StockMovement> StockMovements { get; }
}

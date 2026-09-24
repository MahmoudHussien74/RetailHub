using RetailHub.Application.Interfaces;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Infrastructure.Persistence.Repositories;

namespace RetailHub.Infrastructure.Persistence;

/// <summary>
/// Aggregates all repositories and delegates SaveChangesAsync to the DbContext.
/// Lazy-initializes repositories to avoid creating unused instances.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    private IProductRepository? _products;
    private IBatchRepository? _batches;
    private IStockMovementRepository? _stockMovements;
    private ICategoryRepository? _categories;
    private IBrandRepository? _brands;
    private IWarehouseRepository? _warehouses;
    private IInvoiceRepository? _invoices;

    public UnitOfWork(AppDbContext context) => _context = context;

    public IProductRepository Products =>
        _products ??= new ProductRepository(_context);

    public IBatchRepository Batches =>
        _batches ??= new BatchRepository(_context);

    public IStockMovementRepository StockMovements =>
        _stockMovements ??= new StockMovementRepository(_context);

    public ICategoryRepository Categories =>
        _categories ??= new CategoryRepository(_context);

    public IBrandRepository Brands =>
        _brands ??= new BrandRepository(_context);

    public IWarehouseRepository Warehouses =>
        _warehouses ??= new WarehouseRepository(_context);

    public IInvoiceRepository Invoices =>
        _invoices ??= new InvoiceRepository(_context);

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _context.SaveChangesAsync(ct);

    public void Dispose() => _context.Dispose();
}

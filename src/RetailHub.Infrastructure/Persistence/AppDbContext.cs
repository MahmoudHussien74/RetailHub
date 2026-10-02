using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Common;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseInvoice> PurchaseInvoices => Set<PurchaseInvoice>();
    public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems => Set<PurchaseInvoiceItem>();
    public DbSet<ReturnInvoice> ReturnInvoices => Set<ReturnInvoice>();
    public DbSet<ReturnInvoiceItem> ReturnInvoiceItems => Set<ReturnInvoiceItem>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<SalaryAdvance> SalaryAdvances => Set<SalaryAdvance>();
    public DbSet<CashDrawerTransaction> CashDrawerTransactions => Set<CashDrawerTransaction>();
    public DbSet<ProductUnit> ProductUnits => Set<ProductUnit>();
    public DbSet<Shift> Shifts => Set<Shift>();

    // IAppDbContext — exposes IQueryable for Query handlers (Projection + AsNoTracking)
    IQueryable<Product> IAppDbContext.Products => Products.AsNoTracking();
    IQueryable<Category> IAppDbContext.Categories => Categories.AsNoTracking();
    IQueryable<Brand> IAppDbContext.Brands => Brands.AsNoTracking();
    IQueryable<Warehouse> IAppDbContext.Warehouses => Warehouses.AsNoTracking();
    IQueryable<Batch> IAppDbContext.Batches => Batches.AsNoTracking();
    IQueryable<StockMovement> IAppDbContext.StockMovements => StockMovements.AsNoTracking();
    IQueryable<Invoice> IAppDbContext.Invoices => Invoices.AsNoTracking();
    IQueryable<InvoiceItem> IAppDbContext.InvoiceItems => InvoiceItems.AsNoTracking();
    IQueryable<Customer> IAppDbContext.Customers => Customers.AsNoTracking();
    IQueryable<Payment> IAppDbContext.Payments => Payments.AsNoTracking();
    IQueryable<Supplier> IAppDbContext.Suppliers => Suppliers.AsNoTracking();
    IQueryable<PurchaseInvoice> IAppDbContext.PurchaseInvoices => PurchaseInvoices.AsNoTracking();
    IQueryable<PurchaseInvoiceItem> IAppDbContext.PurchaseInvoiceItems => PurchaseInvoiceItems.AsNoTracking();
    IQueryable<ReturnInvoice> IAppDbContext.ReturnInvoices => ReturnInvoices.AsNoTracking();
    IQueryable<ReturnInvoiceItem> IAppDbContext.ReturnInvoiceItems => ReturnInvoiceItems.AsNoTracking();
    IQueryable<Employee> IAppDbContext.Employees => Employees.AsNoTracking();
    IQueryable<SalaryAdvance> IAppDbContext.SalaryAdvances => SalaryAdvances.AsNoTracking();
    IQueryable<CashDrawerTransaction> IAppDbContext.CashDrawerTransactions => CashDrawerTransactions.AsNoTracking();
    IQueryable<ProductUnit> IAppDbContext.ProductUnits => ProductUnits.AsNoTracking();
    IQueryable<Shift> IAppDbContext.Shifts => Shifts.AsNoTracking();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all IEntityTypeConfiguration<T> from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = utcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = utcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}

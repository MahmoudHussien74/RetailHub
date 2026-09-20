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

    // IAppDbContext — exposes IQueryable for Query handlers (Projection + AsNoTracking)
    IQueryable<Product> IAppDbContext.Products => Products.AsNoTracking();
    IQueryable<Category> IAppDbContext.Categories => Categories.AsNoTracking();
    IQueryable<Brand> IAppDbContext.Brands => Brands.AsNoTracking();
    IQueryable<Warehouse> IAppDbContext.Warehouses => Warehouses.AsNoTracking();
    IQueryable<Batch> IAppDbContext.Batches => Batches.AsNoTracking();
    IQueryable<StockMovement> IAppDbContext.StockMovements => StockMovements.AsNoTracking();

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

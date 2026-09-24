using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasIndex(s => s.Name)
            .IsUnique();

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Phone)
            .HasMaxLength(20);

        builder.Property(s => s.Address)
            .HasMaxLength(500);

        builder.HasMany(s => s.Batches)
            .WithOne(b => b.Supplier)
            .HasForeignKey(b => b.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.PurchaseInvoices)
            .WithOne(pi => pi.Supplier)
            .HasForeignKey(pi => pi.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

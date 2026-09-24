using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(c => c.Id);

        builder.HasIndex(c => c.Phone)
            .IsUnique();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(c => c.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.Address)
            .HasMaxLength(500);

        builder.Property(c => c.Balance)
            .HasPrecision(18, 2);

        builder.HasMany(c => c.Invoices)
            .WithOne(i => i.Customer)
            .HasForeignKey(i => i.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Payments)
            .WithOne(p => p.Customer)
            .HasForeignKey(p => p.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

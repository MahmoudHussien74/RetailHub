using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItem>
{
    public void Configure(EntityTypeBuilder<InvoiceItem> builder)
    {
        builder.HasKey(ii => ii.Id);

        builder.Property(ii => ii.UnitPriceAtSale)
            .HasPrecision(18, 2);

        builder.Property(ii => ii.UnitCostAtSale)
            .HasPrecision(18, 4); // Higher precision for cost calculations

        // LineTotal is a computed property (not mapped to DB)
        builder.Ignore(ii => ii.LineTotal);

        builder.HasOne(ii => ii.Product)
            .WithMany(p => p.InvoiceItems)
            .HasForeignKey(ii => ii.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ii => ii.Batch)
            .WithMany()
            .HasForeignKey(ii => ii.BatchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

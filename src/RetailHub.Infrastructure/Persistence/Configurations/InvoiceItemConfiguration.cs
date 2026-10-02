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

        builder.Property(ii => ii.DiscountPercentage)
            .HasPrecision(5, 2);

        builder.Property(ii => ii.DiscountAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        // Unit snapshot fields
        builder.Property(ii => ii.UnitName)
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue("وحدة");

        builder.Property(ii => ii.ConversionFactor)
            .HasDefaultValue(1);

        builder.Property(ii => ii.BaseQuantity)
            .HasDefaultValue(0);

        // Computed properties (not mapped to DB)
        builder.Ignore(ii => ii.NetUnitPrice);
        builder.Ignore(ii => ii.LineTotal);

        builder.HasOne(ii => ii.Product)
            .WithMany(p => p.InvoiceItems)
            .HasForeignKey(ii => ii.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ii => ii.Batch)
            .WithMany()
            .HasForeignKey(ii => ii.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ii => ii.Unit)
            .WithMany()
            .HasForeignKey(ii => ii.UnitId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

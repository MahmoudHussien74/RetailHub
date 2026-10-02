using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class ReturnInvoiceItemConfiguration : IEntityTypeConfiguration<ReturnInvoiceItem>
{
    public void Configure(EntityTypeBuilder<ReturnInvoiceItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.UnitPriceAtSale)
            .HasPrecision(18, 2);

        builder.Property(i => i.DiscountPercentage)
            .HasPrecision(5, 2);

        builder.Property(i => i.UnitName)
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue("وحدة");

        builder.Property(i => i.ConversionFactor)
            .HasDefaultValue(1);

        builder.Property(i => i.BaseQuantity)
            .HasDefaultValue(0);

        builder.Ignore(i => i.NetUnitPrice);
        builder.Ignore(i => i.LineTotal);

        builder.HasOne(i => i.InvoiceItem)
            .WithMany(ii => ii.ReturnItems)
            .HasForeignKey(i => i.InvoiceItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Batch)
            .WithMany()
            .HasForeignKey(i => i.BatchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

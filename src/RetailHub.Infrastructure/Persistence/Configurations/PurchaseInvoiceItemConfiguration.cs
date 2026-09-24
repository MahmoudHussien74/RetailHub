using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class PurchaseInvoiceItemConfiguration : IEntityTypeConfiguration<PurchaseInvoiceItem>
{
    public void Configure(EntityTypeBuilder<PurchaseInvoiceItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.UnitCost)
            .HasPrecision(18, 4);

        builder.Ignore(i => i.LineTotal);

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

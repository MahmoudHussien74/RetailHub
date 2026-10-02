using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class ProductUnitConfiguration : IEntityTypeConfiguration<ProductUnit>
{
    public void Configure(EntityTypeBuilder<ProductUnit> builder)
    {
        builder.HasKey(pu => pu.Id);

        builder.Property(pu => pu.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(pu => pu.SalePrice)
            .HasPrecision(18, 2);

        builder.Property(pu => pu.Barcode)
            .HasMaxLength(50);

        builder.HasIndex(pu => pu.Barcode)
            .HasFilter("[Barcode] IS NOT NULL")
            .IsUnique();

        builder.HasOne(pu => pu.Product)
            .WithMany(p => p.Units)
            .HasForeignKey(pu => pu.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

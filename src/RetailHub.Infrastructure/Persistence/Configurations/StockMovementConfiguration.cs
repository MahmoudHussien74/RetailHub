using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.HasKey(sm => sm.Id);

        builder.Property(sm => sm.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasOne(sm => sm.Product)
            .WithMany()
            .HasForeignKey(sm => sm.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(sm => sm.Batch)
            .WithMany()
            .HasForeignKey(sm => sm.BatchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

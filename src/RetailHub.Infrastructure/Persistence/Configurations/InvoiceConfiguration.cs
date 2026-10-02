using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.HasKey(i => i.Id);

        builder.HasIndex(i => i.InvoiceNumber)
            .IsUnique();

        builder.HasIndex(i => i.CreatedAt); 

        builder.Property(i => i.InvoiceNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(i => i.Subtotal)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.DiscountPercent)
            .HasPrecision(5, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.DiscountAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.TotalAmount)
            .HasPrecision(18, 2);

        builder.Ignore(i => i.Total);

        builder.Property(i => i.DiscountReason)
            .HasMaxLength(250)
            .IsRequired(false);

        builder.Property(i => i.DiscountedByUserId)
            .IsRequired(false);

        builder.Property(i => i.AmountPaid)
            .HasPrecision(18, 2);

        builder.Property(i => i.PaymentStatus)
            .HasConversion<string>()
            .HasMaxLength(10);

        builder.HasMany(i => i.Items)
            .WithOne(ii => ii.Invoice)
            .HasForeignKey(ii => ii.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
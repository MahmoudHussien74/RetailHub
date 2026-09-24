using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class ReturnInvoiceConfiguration : IEntityTypeConfiguration<ReturnInvoice>
{
    public void Configure(EntityTypeBuilder<ReturnInvoice> builder)
    {
        builder.HasKey(r => r.Id);

        builder.HasIndex(r => r.ReturnDate);

        builder.Property(r => r.TotalRefundAmount)
            .HasPrecision(18, 2);

        builder.HasOne(r => r.OriginalInvoice)
            .WithMany(i => i.ReturnInvoices)
            .HasForeignKey(r => r.OriginalInvoiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Customer)
            .WithMany()
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Items)
            .WithOne(i => i.ReturnInvoice)
            .HasForeignKey(i => i.ReturnInvoiceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

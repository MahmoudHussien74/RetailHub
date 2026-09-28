using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class CashDrawerTransactionConfiguration : IEntityTypeConfiguration<CashDrawerTransaction>
{
    public void Configure(EntityTypeBuilder<CashDrawerTransaction> builder)
    {
        builder.HasKey(t => t.Id);

        builder.HasIndex(t => t.TransactionDate);

        builder.Property(t => t.Type)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(t => t.Amount)
            .HasPrecision(18, 2);

        builder.Property(t => t.Notes)
            .HasMaxLength(500);
    }
}

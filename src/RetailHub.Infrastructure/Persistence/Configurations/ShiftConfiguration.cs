using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class ShiftConfiguration : IEntityTypeConfiguration<Shift>
{
    public void Configure(EntityTypeBuilder<Shift> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.CashierName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.OpeningBalance)
            .HasPrecision(18, 2);

        builder.Property(s => s.TotalCashIn)
            .HasPrecision(18, 2);

        builder.Property(s => s.TotalCashOut)
            .HasPrecision(18, 2);

        builder.Property(s => s.ExpectedCash)
            .HasPrecision(18, 2);

        builder.Property(s => s.ActualCash)
            .HasPrecision(18, 2);

        builder.Property(s => s.Difference)
            .HasPrecision(18, 2);

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(s => s.Notes)
            .HasMaxLength(500);

        builder.HasIndex(s => s.IsOpen);
        builder.HasIndex(s => s.StartTime);
    }
}

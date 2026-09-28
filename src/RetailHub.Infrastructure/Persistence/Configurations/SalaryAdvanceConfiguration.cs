using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class SalaryAdvanceConfiguration : IEntityTypeConfiguration<SalaryAdvance>
{
    public void Configure(EntityTypeBuilder<SalaryAdvance> builder)
    {
        builder.HasKey(sa => sa.Id);

        builder.HasIndex(sa => sa.AdvanceDate);

        builder.Property(sa => sa.Amount)
            .HasPrecision(18, 2);

        builder.Property(sa => sa.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(sa => sa.Notes)
            .HasMaxLength(500);
    }
}

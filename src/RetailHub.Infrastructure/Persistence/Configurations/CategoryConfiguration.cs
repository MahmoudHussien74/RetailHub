using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.NameAr)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.NameEn)
            .HasMaxLength(150);

        builder.Property(c => c.DescriptionAr)
            .HasMaxLength(500);

        builder.Property(c => c.DescriptionEn)
            .HasMaxLength(500);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Phone)
            .HasMaxLength(20);

        builder.Property(e => e.Role)
            .HasMaxLength(100);

        builder.Property(e => e.BaseSalary)
            .HasPrecision(18, 2);

        builder.HasMany(e => e.SalaryAdvances)
            .WithOne(sa => sa.Employee)
            .HasForeignKey(sa => sa.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

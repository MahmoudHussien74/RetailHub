using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Employee : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? Role { get; private set; }
    public decimal BaseSalary { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<SalaryAdvance> SalaryAdvances { get; private set; } = [];

    private Employee() { } // EF Core

    public static Employee Create(string name, decimal baseSalary, string? phone = null, string? role = null)
    {
        if (baseSalary < 0)
            throw new ArgumentException("Base salary cannot be negative.", nameof(baseSalary));

        return new Employee
        {
            Name = name,
            BaseSalary = baseSalary,
            Phone = phone,
            Role = role
        };
    }

    public void Update(string name, decimal baseSalary, string? phone, string? role)
    {
        if (baseSalary < 0)
            throw new ArgumentException("Base salary cannot be negative.", nameof(baseSalary));

        Name = name;
        BaseSalary = baseSalary;
        Phone = phone;
        Role = role;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}

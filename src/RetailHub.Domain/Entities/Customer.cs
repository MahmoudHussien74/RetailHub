using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Customer : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Address { get; private set; }
    public decimal Balance { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<Invoice> Invoices { get; private set; } = [];
    public ICollection<Payment> Payments { get; private set; } = [];

    private Customer() { } // EF Core

    public static Customer Create(string name, string phone, string? address = null)
    {
        return new Customer
        {
            Name = name,
            Phone = phone,
            Address = address,
            Balance = 0m
        };
    }

    public void Update(string name, string phone, string? address)
    {
        Name = name;
        Phone = phone;
        Address = address;
    }

    /// <summary>
    /// Adjusts the customer's credit balance.
    /// Positive amount = increase debt (credit sale).
    /// Negative amount = decrease debt (payment received / return refund).
    /// </summary>
    public void AdjustBalance(decimal amount)
    {
        Balance += amount;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}

using RetailHub.Domain.Common;

namespace RetailHub.Domain.Entities;

public class Supplier : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? Address { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<PurchaseInvoice> PurchaseInvoices { get; private set; } = [];
    public ICollection<Batch> Batches { get; private set; } = [];

    private Supplier() { } // EF Core

    public static Supplier Create(string name, string? phone = null, string? address = null)
    {
        return new Supplier
        {
            Name = name,
            Phone = phone,
            Address = address
        };
    }

    public void Update(string name, string? phone, string? address)
    {
        Name = name;
        Phone = phone;
        Address = address;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}

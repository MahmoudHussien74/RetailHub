using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _context;

    public CustomerRepository(AppDbContext context) => _context = context;

    public async Task<Customer?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<Customer>().FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(Customer customer, CancellationToken ct = default) =>
        await _context.Set<Customer>().AddAsync(customer, ct);

    public void Update(Customer customer) =>
        _context.Set<Customer>().Update(customer);

    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<Customer>().AnyAsync(c => c.Id == id, ct);

    public async Task<bool> ExistsByPhoneAsync(string phone, CancellationToken ct = default) =>
        await _context.Set<Customer>().AnyAsync(c => c.Phone == phone, ct);

    public async Task<bool> ExistsByPhoneAsync(string phone, Guid excludeId, CancellationToken ct = default) =>
        await _context.Set<Customer>().AnyAsync(c => c.Phone == phone && c.Id != excludeId, ct);
}

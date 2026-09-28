using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class EmployeeRepository : IEmployeeRepository
{
    private readonly AppDbContext _context;

    public EmployeeRepository(AppDbContext context) => _context = context;

    public async Task<Employee?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<Employee>().FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task AddAsync(Employee employee, CancellationToken ct = default) =>
        await _context.Set<Employee>().AddAsync(employee, ct);

    public void Update(Employee employee) =>
        _context.Set<Employee>().Update(employee);

    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<Employee>().AnyAsync(e => e.Id == id, ct);
}

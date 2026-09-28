using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class SalaryAdvanceRepository : ISalaryAdvanceRepository
{
    private readonly AppDbContext _context;

    public SalaryAdvanceRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(SalaryAdvance advance, CancellationToken ct = default) =>
        await _context.Set<SalaryAdvance>().AddAsync(advance, ct);

    public async Task<SalaryAdvance?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<SalaryAdvance>().FirstOrDefaultAsync(sa => sa.Id == id, ct);
}

using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class ShiftRepository : IShiftRepository
{
    private readonly AppDbContext _context;

    public ShiftRepository(AppDbContext context) => _context = context;

    public async Task<Shift?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Shifts.FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<Shift?> GetActiveShiftAsync(Guid? cashierId = null, CancellationToken ct = default)
    {
        var query = _context.Shifts.Where(s => s.IsOpen);
        if (cashierId.HasValue)
        {
            query = query.Where(s => s.CashierId == cashierId.Value);
        }
        return await query.OrderByDescending(s => s.StartTime).FirstOrDefaultAsync(ct);
    }

    public async Task AddAsync(Shift shift, CancellationToken ct = default) =>
        await _context.Shifts.AddAsync(shift, ct);

    public void Update(Shift shift) =>
        _context.Shifts.Update(shift);
}

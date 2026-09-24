using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _context;

    public PaymentRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(Payment payment, CancellationToken ct = default) =>
        await _context.Set<Payment>().AddAsync(payment, ct);
}

using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Interfaces.Repositories;
using RetailHub.Domain.Entities;

namespace RetailHub.Infrastructure.Persistence.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _context;

    public CategoryRepository(AppDbContext context) => _context = context;

    public async Task<Category?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(Category category, CancellationToken ct = default) =>
        await _context.Categories.AddAsync(category, ct);

    public void Update(Category category) =>
        _context.Categories.Update(category);

    public async Task<bool> ExistsByNameAsync(string nameAr, CancellationToken ct = default) =>
        await _context.Categories.AnyAsync(c => c.NameAr == nameAr && c.IsActive, ct);
}

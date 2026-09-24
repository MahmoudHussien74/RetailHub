using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Customers.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Customers.Queries.GetCustomers;

public class GetCustomersQueryHandler
    : IRequestHandler<GetCustomersQuery, Result<PagedResult<CustomerListDto>>>
{
    private readonly IAppDbContext _context;

    public GetCustomersQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<CustomerListDto>>> Handle(
        GetCustomersQuery request, CancellationToken ct)
    {
        var query = _context.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(c =>
                c.Name.Contains(search) || c.Phone.Contains(search));
        }

        if (request.IsActive.HasValue)
            query = query.Where(c => c.IsActive == request.IsActive.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CustomerListDto
            {
                Id = c.Id,
                Name = c.Name,
                Phone = c.Phone,
                Balance = c.Balance,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<CustomerListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<CustomerListDto>>.Success(pagedResult);
    }
}

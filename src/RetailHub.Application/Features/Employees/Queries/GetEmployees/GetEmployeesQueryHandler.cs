using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Employees.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Employees.Queries.GetEmployees;

public class GetEmployeesQueryHandler
    : IRequestHandler<GetEmployeesQuery, Result<PagedResult<EmployeeListDto>>>
{
    private readonly IAppDbContext _context;

    public GetEmployeesQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<EmployeeListDto>>> Handle(
        GetEmployeesQuery request, CancellationToken ct)
    {
        var query = _context.Employees.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(e =>
                e.Name.Contains(search) ||
                (e.Phone != null && e.Phone.Contains(search)));
        }

        if (request.IsActive.HasValue)
            query = query.Where(e => e.IsActive == request.IsActive.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new EmployeeListDto
            {
                Id = e.Id,
                Name = e.Name,
                Phone = e.Phone,
                Role = e.Role,
                BaseSalary = e.BaseSalary,
                IsActive = e.IsActive,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<EmployeeListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<EmployeeListDto>>.Success(pagedResult);
    }
}

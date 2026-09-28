using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.SalaryAdvances.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.SalaryAdvances.Queries.GetAdvancesByEmployee;

public class GetAdvancesByEmployeeQueryHandler
    : IRequestHandler<GetAdvancesByEmployeeQuery, Result<PagedResult<SalaryAdvanceListDto>>>
{
    private readonly IAppDbContext _context;

    public GetAdvancesByEmployeeQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<SalaryAdvanceListDto>>> Handle(
        GetAdvancesByEmployeeQuery request, CancellationToken ct)
    {
        var query = _context.SalaryAdvances
            .Where(sa => sa.EmployeeId == request.EmployeeId);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(sa => sa.AdvanceDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(sa => new SalaryAdvanceListDto
            {
                Id = sa.Id,
                EmployeeId = sa.EmployeeId,
                EmployeeName = sa.Employee.Name,
                Amount = sa.Amount,
                AdvanceDate = sa.AdvanceDate,
                Status = sa.Status.ToString(),
                Notes = sa.Notes
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<SalaryAdvanceListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<SalaryAdvanceListDto>>.Success(pagedResult);
    }
}

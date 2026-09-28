using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Employees.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Employees.Queries.GetEmployeeById;

public class GetEmployeeByIdQueryHandler
    : IRequestHandler<GetEmployeeByIdQuery, Result<EmployeeDetailDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetEmployeeByIdQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<EmployeeDetailDto>> Handle(GetEmployeeByIdQuery request, CancellationToken ct)
    {
        var dto = await _context.Employees
            .Where(e => e.Id == request.Id)
            .Select(e => new EmployeeDetailDto
            {
                Id = e.Id,
                Name = e.Name,
                Phone = e.Phone,
                Role = e.Role,
                BaseSalary = e.BaseSalary,
                IsActive = e.IsActive,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .FirstOrDefaultAsync(ct);

        return dto is not null
            ? Result<EmployeeDetailDto>.Success(dto)
            : Result<EmployeeDetailDto>.Failure(_localizer[MessageKeys.EmployeeNotFound]);
    }
}

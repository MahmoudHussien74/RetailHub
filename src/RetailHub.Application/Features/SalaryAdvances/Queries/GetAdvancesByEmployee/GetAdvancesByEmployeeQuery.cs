using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.SalaryAdvances.DTOs;

namespace RetailHub.Application.Features.SalaryAdvances.Queries.GetAdvancesByEmployee;

public record GetAdvancesByEmployeeQuery(
    Guid? EmployeeId = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<SalaryAdvanceListDto>>>;

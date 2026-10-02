using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Shifts.DTOs;

namespace RetailHub.Application.Features.Shifts.Queries.GetCurrentShift;

public record GetCurrentShiftQuery(Guid? CashierId = null) : IRequest<Result<ShiftDto>>;

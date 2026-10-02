using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Shifts.DTOs;

namespace RetailHub.Application.Features.Shifts.Queries.GetShiftById;

public record GetShiftByIdQuery(Guid Id) : IRequest<Result<ShiftDto>>;

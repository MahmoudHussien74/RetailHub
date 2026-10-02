using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Shifts.DTOs;

namespace RetailHub.Application.Features.Shifts.Commands.StartShift;

public record StartShiftCommand(
    string CashierName,
    decimal OpeningBalance = 0m,
    Guid? CashierId = null,
    string? Notes = null
) : IRequest<Result<ShiftDto>>;

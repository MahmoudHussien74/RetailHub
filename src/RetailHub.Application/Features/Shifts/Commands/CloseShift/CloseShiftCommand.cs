using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Shifts.DTOs;

namespace RetailHub.Application.Features.Shifts.Commands.CloseShift;

public record CloseShiftCommand(
    decimal ActualCash,
    string? Notes = null,
    Guid? CashierId = null,
    string? CashierName = null
) : IRequest<Result<ShiftDto>>;

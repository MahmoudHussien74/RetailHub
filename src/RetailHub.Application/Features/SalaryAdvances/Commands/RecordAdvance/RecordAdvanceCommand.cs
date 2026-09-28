using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.SalaryAdvances.Commands.RecordAdvance;

public record RecordAdvanceCommand(
    Guid EmployeeId,
    decimal Amount,
    bool DeductFromCashDrawer,
    string? Notes) : IRequest<Result<Guid>>;

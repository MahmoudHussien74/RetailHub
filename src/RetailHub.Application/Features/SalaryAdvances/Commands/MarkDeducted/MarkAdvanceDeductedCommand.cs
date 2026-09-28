using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.SalaryAdvances.Commands.MarkDeducted;

public record MarkAdvanceDeductedCommand(Guid AdvanceId) : IRequest<Result>;

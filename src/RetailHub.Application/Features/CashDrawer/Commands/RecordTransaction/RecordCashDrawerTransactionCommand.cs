using MediatR;
using RetailHub.Application.Common;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.CashDrawer.Commands.RecordTransaction;

public record RecordCashDrawerTransactionCommand(
    CashDrawerTransactionType Type,
    decimal Amount,
    Guid? ReferenceId,
    string? Notes) : IRequest<Result<Guid>>;

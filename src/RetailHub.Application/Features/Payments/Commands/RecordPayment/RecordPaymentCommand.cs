using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Payments.Commands.RecordPayment;

public record RecordPaymentCommand(
    Guid CustomerId,
    decimal Amount,
    Guid? InvoiceId = null,
    string? Notes = null) : IRequest<Result<Guid>>;

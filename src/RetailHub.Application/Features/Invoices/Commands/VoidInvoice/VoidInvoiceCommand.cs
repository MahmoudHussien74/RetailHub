using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Invoices.Commands.VoidInvoice;

public record VoidInvoiceCommand(Guid InvoiceId) : IRequest<Result>;

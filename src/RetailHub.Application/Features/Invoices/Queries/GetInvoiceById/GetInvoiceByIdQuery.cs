using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Invoices.DTOs;

namespace RetailHub.Application.Features.Invoices.Queries.GetInvoiceById;

public record GetInvoiceByIdQuery(Guid Id) : IRequest<Result<InvoiceDetailDto>>;

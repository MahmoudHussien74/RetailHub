using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Invoices.DTOs;

namespace RetailHub.Application.Features.Invoices.Commands.CreateSaleInvoice;

public record CreateSaleInvoiceCommand(
    List<SaleItemRequest> Items,
    decimal AmountPaid,
    Guid? CustomerId = null) : IRequest<Result<Guid>>;

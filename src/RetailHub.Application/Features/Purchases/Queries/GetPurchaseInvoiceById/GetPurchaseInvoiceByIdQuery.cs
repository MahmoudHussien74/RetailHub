using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Purchases.DTOs;

namespace RetailHub.Application.Features.Purchases.Queries.GetPurchaseInvoiceById;

public record GetPurchaseInvoiceByIdQuery(Guid Id) : IRequest<Result<PurchaseInvoiceDetailDto>>;

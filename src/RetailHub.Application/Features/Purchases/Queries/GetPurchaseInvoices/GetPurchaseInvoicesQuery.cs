using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Purchases.DTOs;

namespace RetailHub.Application.Features.Purchases.Queries.GetPurchaseInvoices;

public record GetPurchaseInvoicesQuery(
    int Page = 1,
    int PageSize = 10,
    Guid? SupplierId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null) : IRequest<Result<PagedResult<PurchaseInvoiceListDto>>>;

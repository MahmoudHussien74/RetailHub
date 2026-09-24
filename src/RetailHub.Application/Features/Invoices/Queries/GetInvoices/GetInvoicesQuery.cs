using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Invoices.DTOs;
using RetailHub.Domain.Enums;

namespace RetailHub.Application.Features.Invoices.Queries.GetInvoices;

public record GetInvoicesQuery(
    int Page = 1,
    int PageSize = 10,
    PaymentStatus? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    bool? IsVoided = null) : IRequest<Result<PagedResult<InvoiceListDto>>>;

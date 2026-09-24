using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Returns.DTOs;

namespace RetailHub.Application.Features.Returns.Queries.GetReturnInvoices;

public record GetReturnInvoicesQuery(
    int Page = 1,
    int PageSize = 10,
    Guid? OriginalInvoiceId = null,
    Guid? CustomerId = null) : IRequest<Result<PagedResult<ReturnInvoiceListDto>>>;

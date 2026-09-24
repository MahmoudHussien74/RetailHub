using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Payments.DTOs;

namespace RetailHub.Application.Features.Payments.Queries.GetCustomerPayments;

public record GetCustomerPaymentsQuery(
    Guid CustomerId,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<PaymentListDto>>>;

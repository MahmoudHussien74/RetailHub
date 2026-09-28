using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.CashDrawer.DTOs;

namespace RetailHub.Application.Features.CashDrawer.Queries.GetTransactions;

public record GetCashDrawerTransactionsQuery(
    DateTime Date,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<PagedResult<CashDrawerTransactionDto>>>;

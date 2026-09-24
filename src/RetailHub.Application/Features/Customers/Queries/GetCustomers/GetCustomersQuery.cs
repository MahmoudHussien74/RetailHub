using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Customers.DTOs;

namespace RetailHub.Application.Features.Customers.Queries.GetCustomers;

public record GetCustomersQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    bool? IsActive = null) : IRequest<Result<PagedResult<CustomerListDto>>>;

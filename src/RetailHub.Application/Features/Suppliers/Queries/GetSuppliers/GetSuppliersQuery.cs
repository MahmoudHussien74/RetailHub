using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Suppliers.DTOs;

namespace RetailHub.Application.Features.Suppliers.Queries.GetSuppliers;

public record GetSuppliersQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    bool? IsActive = null) : IRequest<Result<PagedResult<SupplierListDto>>>;

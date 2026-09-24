using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.StockMovements.DTOs;

namespace RetailHub.Application.Features.StockMovements.Queries.GetMovementsByProduct;

public record GetMovementsByProductQuery(
    Guid ProductId,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<StockMovementDto>>>;

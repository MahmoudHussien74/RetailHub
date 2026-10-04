using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.StockAdjustments.DTOs;

namespace RetailHub.Application.Features.StockAdjustments.Queries.GetStockAdjustments;

public record GetStockAdjustmentsQuery(
    int Page = 1,
    int PageSize = 15,
    DateTime? From = null,
    DateTime? To = null) : IRequest<Result<StockAdjustmentListDto>>;

using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.CashDrawer.DTOs;

namespace RetailHub.Application.Features.CashDrawer.Queries.GetDailySummary;

public record GetDailySummaryQuery(DateTime Date) : IRequest<Result<DailySummaryDto>>;

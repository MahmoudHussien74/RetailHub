using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Dashboard.DTOs;

namespace RetailHub.Application.Features.Dashboard.Queries.GetDashboardStats;

public record GetDashboardStatsQuery : IRequest<Result<DashboardStatsDto>>;

using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Warehouses.DTOs;

namespace RetailHub.Application.Features.Warehouses.Queries.GetDefaultWarehouse;

public record GetDefaultWarehouseQuery : IRequest<Result<WarehouseDto>>;

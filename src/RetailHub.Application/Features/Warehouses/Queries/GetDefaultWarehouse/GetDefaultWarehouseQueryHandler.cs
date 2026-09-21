using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Warehouses.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Warehouses.Queries.GetDefaultWarehouse;

public class GetDefaultWarehouseQueryHandler
    : IRequestHandler<GetDefaultWarehouseQuery, Result<WarehouseDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetDefaultWarehouseQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<WarehouseDto>> Handle(GetDefaultWarehouseQuery request, CancellationToken ct)
    {
        var dto = await _context.Warehouses
            .Where(w => w.IsDefault)
            .ProjectToType<WarehouseDto>()
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? Result<WarehouseDto>.Failure(_localizer[MessageKeys.DefaultWarehouseNotFound])
            : Result<WarehouseDto>.Success(dto);
    }
}

using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Brands.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Brands.Queries.GetBrandById;

public class GetBrandByIdQueryHandler
    : IRequestHandler<GetBrandByIdQuery, Result<BrandDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetBrandByIdQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<BrandDto>> Handle(GetBrandByIdQuery request, CancellationToken ct)
    {
        var dto = await _context.Brands
            .Where(b => b.Id == request.Id)
            .ProjectToType<BrandDto>()
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? Result<BrandDto>.Failure(_localizer[MessageKeys.BrandNotFound])
            : Result<BrandDto>.Success(dto);
    }
}

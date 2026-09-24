using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Categories.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Categories.Queries.GetCategoryById;

public class GetCategoryByIdQueryHandler
    : IRequestHandler<GetCategoryByIdQuery, Result<CategoryDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetCategoryByIdQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<CategoryDto>> Handle(GetCategoryByIdQuery request, CancellationToken ct)
    {
        var dto = await _context.Categories
            .Where(c => c.Id == request.Id)
            .ProjectToType<CategoryDto>()
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? Result<CategoryDto>.Failure(_localizer[MessageKeys.CategoryNotFound])
            : Result<CategoryDto>.Success(dto);
    }
}

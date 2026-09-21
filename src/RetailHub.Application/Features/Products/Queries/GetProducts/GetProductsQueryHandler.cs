using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Products.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Products.Queries.GetProducts;

public class GetProductsQueryHandler
    : IRequestHandler<GetProductsQuery, Result<PagedResult<ProductListDto>>>
{
    private readonly IAppDbContext _context;

    public GetProductsQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<ProductListDto>>> Handle(
        GetProductsQuery request, CancellationToken ct)
    {
        var query = _context.Products
            .Where(p => p.IsActive);

        // Apply search filter on barcode or name (Arabic/English)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(p =>
                p.Barcode.Contains(search) ||
                p.NameAr.Contains(search) ||
                (p.NameEn != null && p.NameEn.Contains(search)));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderBy(p => p.NameAr)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductListDto
            {
                Id = p.Id,
                Barcode = p.Barcode,
                NameAr = p.NameAr,
                NameEn = p.NameEn,
                CategoryNameAr = p.Category.NameAr,
                CategoryNameEn = p.Category.NameEn,
                BrandNameAr = p.Brand.NameAr,
                BrandNameEn = p.Brand.NameEn,
                SellingPrice = p.SellingPrice,
                AverageCost = p.AverageCost,
                TotalStock = p.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity)
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<ProductListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<ProductListDto>>.Success(pagedResult);
    }
}

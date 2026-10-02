using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Helpers;
using RetailHub.Application.Features.Products.DTOs;
using RetailHub.Application.Features.ProductUnits.DTOs;
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

        if (request.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

        if (request.BrandId.HasValue)
        {
            query = query.Where(p => p.BrandId == request.BrandId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.StockStatus))
        {
            switch (request.StockStatus.ToLower())
            {
                case "lowstock":
                    query = query.Where(p => p.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity) <= 5);
                    break;
                case "outofstock":
                    query = query.Where(p => p.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity) == 0);
                    break;
                case "instock":
                    query = query.Where(p => p.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity) > 5);
                    break;
            }
        }
        else if (request.LowStockOnly == true)
        {
            query = query.Where(p => p.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity) <= 5);
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
                TotalStock = p.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity),
                Units = p.Units
                    .OrderBy(u => u.ConversionFactor)
                    .Select(u => new ProductUnitDto
                    {
                        Id = u.Id,
                        ProductId = u.ProductId,
                        Name = u.Name,
                        ConversionFactor = u.ConversionFactor,
                        SalePrice = u.SalePrice,
                        Barcode = u.Barcode,
                        IsDefaultSale = u.IsDefaultSale
                    }).ToList()
            })
            .ToListAsync(ct);

        foreach (var item in items)
        {
            item.StockDisplay = StockDisplayHelper.FormatMixedStock(item.TotalStock, item.Units);
        }

        var pagedResult = new PagedResult<ProductListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<ProductListDto>>.Success(pagedResult);
    }
}

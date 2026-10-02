using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Common.Helpers;
using RetailHub.Application.Features.Batches.DTOs;
using RetailHub.Application.Features.Products.DTOs;
using RetailHub.Application.Features.ProductUnits.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Products.Queries.GetProductByBarcode;

public class GetProductByBarcodeQueryHandler
    : IRequestHandler<GetProductByBarcodeQuery, Result<ProductDetailDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetProductByBarcodeQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<ProductDetailDto>> Handle(GetProductByBarcodeQuery request, CancellationToken ct)
    {
        var dto = await _context.Products
            .Where(p => p.Barcode == request.Barcode || p.Units.Any(u => u.Barcode == request.Barcode))
            .Select(p => new ProductDetailDto
            {
                Id = p.Id,
                Barcode = p.Barcode,
                NameAr = p.NameAr,
                NameEn = p.NameEn,
                CategoryId = p.CategoryId,
                CategoryNameAr = p.Category.NameAr,
                CategoryNameEn = p.Category.NameEn,
                BrandId = p.BrandId,
                BrandNameAr = p.Brand.NameAr,
                BrandNameEn = p.Brand.NameEn,
                SellingPrice = p.SellingPrice,
                AverageCost = p.AverageCost,
                TotalStock = p.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity),
                IsActive = p.IsActive,
                Batches = p.Batches
                    .Where(b => b.Quantity > 0)
                    .OrderBy(b => b.ExpiryDate)
                    .Select(b => new BatchDto
                    {
                        Id = b.Id,
                        ProductId = b.ProductId,
                        WarehouseId = b.WarehouseId,
                        PurchasePrice = b.PurchasePrice,
                        Quantity = b.Quantity,
                        ExpiryDate = b.ExpiryDate,
                        SupplierId = b.SupplierId,
                        CreatedAt = b.CreatedAt
                    }).ToList(),
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
            .FirstOrDefaultAsync(ct);

        if (dto is null)
            return Result<ProductDetailDto>.Failure(_localizer[MessageKeys.ProductNotFound]);

        dto.StockDisplay = StockDisplayHelper.FormatMixedStock(dto.TotalStock, dto.Units);

        return Result<ProductDetailDto>.Success(dto);
    }
}

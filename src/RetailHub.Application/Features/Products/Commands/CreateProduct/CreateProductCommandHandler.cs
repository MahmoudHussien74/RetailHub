using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.Products.Commands.CreateProduct;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreateProductCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken ct)
    {
        if (await _unitOfWork.Products.ExistsAsync(request.Barcode, ct))
            return Result<Guid>.Failure(string.Format(_localizer[MessageKeys.ProductBarcodeExists], request.Barcode));

        if (!await _unitOfWork.Categories.ExistsAsync(request.CategoryId, ct))
            return Result<Guid>.Failure(_localizer[MessageKeys.CategoryNotFound]);

        if (!await _unitOfWork.Brands.ExistsAsync(request.BrandId, ct))
            return Result<Guid>.Failure(_localizer[MessageKeys.BrandNotFound]);

        var product = Product.Create(
            request.Barcode,
            request.NameAr,
            request.NameEn,
            request.CategoryId,
            request.BrandId,
            request.SellingPrice);

        await _unitOfWork.Products.AddAsync(product, ct);

        if (request.Units != null && request.Units.Count > 0)
        {
            var hasDefault = request.Units.Any(u => u.IsDefaultSale);
            for (int i = 0; i < request.Units.Count; i++)
            {
                var u = request.Units[i];
                var isDefault = hasDefault ? u.IsDefaultSale : (i == 0);
                var unit = ProductUnit.Create(
                    product.Id,
                    u.Name,
                    u.ConversionFactor,
                    u.SalePrice,
                    u.Barcode,
                    isDefault);

                await _unitOfWork.ProductUnits.AddAsync(unit, ct);
            }
        }
        else
        {
            // Create default "علبة" unit with base conversion factor 1
            var defaultUnit = ProductUnit.Create(
                product.Id,
                "علبة",
                conversionFactor: 1,
                salePrice: request.SellingPrice,
                barcode: request.Barcode,
                isDefaultSale: true);

            await _unitOfWork.ProductUnits.AddAsync(defaultUnit, ct);
        }

        // ── Handle Initial Stock & Cost ──
        if (request.PurchasePrice.HasValue && request.PurchasePrice.Value > 0)
        {
            product.SetInitialCost(request.PurchasePrice.Value);
        }

        if (request.InitialStock.HasValue && request.InitialStock.Value > 0)
        {
            var warehouse = await _unitOfWork.Warehouses.GetDefaultAsync(ct);
            if (warehouse != null)
            {
                var batch = Batch.Create(
                    product.Id,
                    warehouse.Id,
                    request.PurchasePrice ?? 0m,
                    request.InitialStock.Value,
                    request.ExpiryDate ?? DateTime.UtcNow.AddYears(2));

                await _unitOfWork.Batches.AddAsync(batch, ct);
                product.RecalculateAverageCost([batch]);
            }
        }

        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(product.Id);
    }
}

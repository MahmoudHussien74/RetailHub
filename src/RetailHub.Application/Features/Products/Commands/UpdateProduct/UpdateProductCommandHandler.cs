using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Products.Commands.UpdateProduct;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public UpdateProductCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(request.Id, ct);

        if (product is null)
            return Result.Failure(_localizer[MessageKeys.ProductNotFound]);

        if (!await _unitOfWork.Categories.ExistsAsync(request.CategoryId, ct))
            return Result.Failure(_localizer[MessageKeys.CategoryNotFound]);

        if (!await _unitOfWork.Brands.ExistsAsync(request.BrandId, ct))
            return Result.Failure(_localizer[MessageKeys.BrandNotFound]);

        var targetBarcode = string.IsNullOrWhiteSpace(request.Barcode)
            ? null
            : request.Barcode.Trim();

        if (targetBarcode != null && targetBarcode != product.Barcode && await _unitOfWork.Products.ExistsAsync(targetBarcode, ct))
            return Result.Failure(string.Format(_localizer[MessageKeys.ProductBarcodeExists], targetBarcode));

        var oldBarcode = product.Barcode;
        product.Update(targetBarcode, request.NameAr, request.NameEn, request.CategoryId, request.BrandId);
        _unitOfWork.Products.Update(product);

        // Synchronize default unit barcode if it had the old barcode
        var defaultUnit = await _unitOfWork.ProductUnits.GetDefaultUnitByProductIdAsync(product.Id, ct);
        if (defaultUnit != null && (defaultUnit.Barcode == oldBarcode || string.IsNullOrEmpty(defaultUnit.Barcode)))
        {
            defaultUnit.Update(defaultUnit.Name, defaultUnit.ConversionFactor, defaultUnit.SalePrice, targetBarcode, defaultUnit.IsDefaultSale);
            _unitOfWork.ProductUnits.Update(defaultUnit);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}

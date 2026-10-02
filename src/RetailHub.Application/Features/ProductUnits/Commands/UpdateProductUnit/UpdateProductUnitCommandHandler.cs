using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.ProductUnits.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.ProductUnits.Commands.UpdateProductUnit;

public class UpdateProductUnitCommandHandler
    : IRequestHandler<UpdateProductUnitCommand, Result<ProductUnitDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public UpdateProductUnitCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<ProductUnitDto>> Handle(UpdateProductUnitCommand request, CancellationToken ct)
    {
        var unit = await _unitOfWork.ProductUnits.GetByIdAsync(request.UnitId, ct);
        if (unit is null)
            return Result<ProductUnitDto>.Failure("وحدة المنتج غير موجودة.");

        // If setting as default, clear other defaults for this product
        if (request.IsDefaultSale)
        {
            var siblings = await _unitOfWork.ProductUnits.GetByProductIdAsync(unit.ProductId, ct);
            foreach (var sibling in siblings.Where(u => u.IsDefaultSale && u.Id != request.UnitId))
            {
                sibling.Update(sibling.Name, sibling.ConversionFactor, sibling.SalePrice, sibling.Barcode, false);
                _unitOfWork.ProductUnits.Update(sibling);
            }
        }

        unit.Update(request.Name, request.ConversionFactor, request.SalePrice, request.Barcode, request.IsDefaultSale);
        _unitOfWork.ProductUnits.Update(unit);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<ProductUnitDto>.Success(new ProductUnitDto
        {
            Id = unit.Id,
            ProductId = unit.ProductId,
            Name = unit.Name,
            ConversionFactor = unit.ConversionFactor,
            SalePrice = unit.SalePrice,
            Barcode = unit.Barcode,
            IsDefaultSale = unit.IsDefaultSale
        });
    }
}

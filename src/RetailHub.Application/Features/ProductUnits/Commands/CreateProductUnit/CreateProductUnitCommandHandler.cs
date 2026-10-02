using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.ProductUnits.DTOs;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.ProductUnits.Commands.CreateProductUnit;

public class CreateProductUnitCommandHandler
    : IRequestHandler<CreateProductUnitCommand, Result<ProductUnitDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreateProductUnitCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<ProductUnitDto>> Handle(CreateProductUnitCommand request, CancellationToken ct)
    {
        // Validate product exists
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId, ct);
        if (product is null)
            return Result<ProductUnitDto>.Failure(_localizer[MessageKeys.ProductNotFound]);

        // If this unit is set as default, clear other defaults for this product
        if (request.IsDefaultSale)
        {
            var existingUnits = await _unitOfWork.ProductUnits.GetByProductIdAsync(request.ProductId, ct);
            foreach (var existing in existingUnits.Where(u => u.IsDefaultSale))
            {
                existing.Update(existing.Name, existing.ConversionFactor, existing.SalePrice, existing.Barcode, false);
                _unitOfWork.ProductUnits.Update(existing);
            }
        }

        var unit = ProductUnit.Create(
            request.ProductId,
            request.Name,
            request.ConversionFactor,
            request.SalePrice,
            request.Barcode,
            request.IsDefaultSale);

        await _unitOfWork.ProductUnits.AddAsync(unit, ct);
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

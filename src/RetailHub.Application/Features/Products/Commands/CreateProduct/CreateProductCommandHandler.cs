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
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(product.Id);
    }
}

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

        product.Update(request.NameAr, request.NameEn, request.CategoryId, request.BrandId);
        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}

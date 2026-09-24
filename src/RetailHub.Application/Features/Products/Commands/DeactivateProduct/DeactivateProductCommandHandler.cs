using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Products.Commands.DeactivateProduct;

public class DeactivateProductCommandHandler : IRequestHandler<DeactivateProductCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public DeactivateProductCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(DeactivateProductCommand request, CancellationToken ct)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(request.Id, ct);

        if (product is null)
            return Result.Failure(_localizer[MessageKeys.ProductNotFound]);

        product.Deactivate();
        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}

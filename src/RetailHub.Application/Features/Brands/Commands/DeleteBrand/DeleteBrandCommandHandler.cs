using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Brands.Commands.DeleteBrand;

public class DeleteBrandCommandHandler : IRequestHandler<DeleteBrandCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public DeleteBrandCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(DeleteBrandCommand request, CancellationToken ct)
    {
        var brand = await _unitOfWork.Brands.GetByIdAsync(request.Id, ct);

        if (brand is null)
            return Result.Failure(_localizer[MessageKeys.BrandNotFound]);

        brand.Deactivate();
        _unitOfWork.Brands.Update(brand);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}

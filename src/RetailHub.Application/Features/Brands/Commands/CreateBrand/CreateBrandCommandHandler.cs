using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.Brands.Commands.CreateBrand;

public class CreateBrandCommandHandler : IRequestHandler<CreateBrandCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreateBrandCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(CreateBrandCommand request, CancellationToken ct)
    {
        if (await _unitOfWork.Brands.ExistsByNameAsync(request.NameAr, ct))
            return Result<Guid>.Failure(string.Format(_localizer[MessageKeys.BrandAlreadyExists], request.NameAr));

        var brand = Brand.Create(request.NameAr, request.NameEn);

        await _unitOfWork.Brands.AddAsync(brand, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(brand.Id);
    }
}

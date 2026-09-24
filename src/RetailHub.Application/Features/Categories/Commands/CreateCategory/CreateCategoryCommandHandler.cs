using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreateCategoryCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(CreateCategoryCommand request, CancellationToken ct)
    {
        if (await _unitOfWork.Categories.ExistsByNameAsync(request.NameAr, ct))
            return Result<Guid>.Failure(string.Format(_localizer[MessageKeys.CategoryAlreadyExists], request.NameAr));

        var category = Category.Create(
            request.NameAr,
            request.NameEn,
            request.DescriptionAr,
            request.DescriptionEn);

        await _unitOfWork.Categories.AddAsync(category, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(category.Id);
    }
}

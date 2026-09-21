using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public UpdateCategoryCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(UpdateCategoryCommand request, CancellationToken ct)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(request.Id, ct);

        if (category is null)
            return Result.Failure(_localizer[MessageKeys.CategoryNotFound]);

        category.Update(request.NameAr, request.NameEn, request.DescriptionAr, request.DescriptionEn);
        _unitOfWork.Categories.Update(category);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}

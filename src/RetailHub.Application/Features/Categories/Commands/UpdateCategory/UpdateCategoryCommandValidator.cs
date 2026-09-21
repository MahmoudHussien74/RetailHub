using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.NameAr)
            .NotEmpty()
            .WithMessage(_ => string.Format(localizer[MessageKeys.RequiredField], localizer[MessageKeys.CategoryNameAr]))
            .MaximumLength(150)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.CategoryNameAr], 150));

        RuleFor(x => x.NameEn)
            .MaximumLength(150)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.CategoryNameEn], 150));
    }
}

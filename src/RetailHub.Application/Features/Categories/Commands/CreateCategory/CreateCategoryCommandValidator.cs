using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.NameAr)
            .NotEmpty()
            .WithMessage(_ => string.Format(localizer[MessageKeys.RequiredField], localizer[MessageKeys.CategoryNameAr]))
            .MaximumLength(150)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.CategoryNameAr], 150));

        RuleFor(x => x.NameEn)
            .MaximumLength(150)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.CategoryNameEn], 150));

        RuleFor(x => x.DescriptionAr)
            .MaximumLength(500)
            .When(x => x.DescriptionAr is not null);

        RuleFor(x => x.DescriptionEn)
            .MaximumLength(500)
            .When(x => x.DescriptionEn is not null);
    }
}

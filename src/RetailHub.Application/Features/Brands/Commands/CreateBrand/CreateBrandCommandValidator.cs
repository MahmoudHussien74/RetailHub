using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Brands.Commands.CreateBrand;

public class CreateBrandCommandValidator : AbstractValidator<CreateBrandCommand>
{
    public CreateBrandCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.NameAr)
            .NotEmpty()
            .WithMessage(_ => string.Format(localizer[MessageKeys.RequiredField], localizer[MessageKeys.BrandNameAr]))
            .MaximumLength(150)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.BrandNameAr], 150));

        RuleFor(x => x.NameEn)
            .MaximumLength(150)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.BrandNameEn], 150));
    }
}

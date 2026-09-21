using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Products.Commands.UpdateProduct;

public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.NameAr)
            .NotEmpty()
            .WithMessage(_ => string.Format(localizer[MessageKeys.RequiredField], localizer[MessageKeys.ProductNameAr]))
            .MaximumLength(200)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.ProductNameAr], 200));

        RuleFor(x => x.NameEn)
            .MaximumLength(200)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MaxLengthExceeded], localizer[MessageKeys.ProductNameEn], 200));

        RuleFor(x => x.CategoryId)
            .NotEmpty()
            .WithMessage(_ => localizer[MessageKeys.ProductCategoryRequired].Value);

        RuleFor(x => x.BrandId)
            .NotEmpty()
            .WithMessage(_ => localizer[MessageKeys.ProductBrandRequired].Value);
    }
}

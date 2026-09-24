using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Products.Commands.CreateProduct;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Barcode)
            .NotEmpty()
            .WithMessage(_ => string.Format(localizer[MessageKeys.RequiredField], localizer[MessageKeys.ProductBarcode]))
            .MaximumLength(50);

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

        RuleFor(x => x.SellingPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage(_ => string.Format(localizer[MessageKeys.MustNotBeNegative], localizer[MessageKeys.ProductSellingPrice]));
    }
}

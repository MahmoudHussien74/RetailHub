using FluentValidation.TestHelper;
using RetailHub.Application.Features.Products.Commands.CreateProduct;
using RetailHub.UnitTests.Invoices;
using Xunit;

namespace RetailHub.UnitTests.ProductUnits;

public class CreateProductWithUnitsTests
{
    private readonly CreateProductCommandValidator _validator;

    public CreateProductWithUnitsTests()
    {
        _validator = new CreateProductCommandValidator(new TestMessagesLocalizer());
    }

    [Fact]
    public void Validator_ValidProductWithUnits_PassesValidation()
    {
        var command = new CreateProductCommand(
            Barcode: "622300123999",
            NameAr: "بانادول إكسترا 24 قرص",
            NameEn: "Panadol Extra 24 Tabs",
            CategoryId: Guid.NewGuid(),
            BrandId: Guid.NewGuid(),
            SellingPrice: 50.00m,
            Units:
            [
                new ProductUnitInputDto("علبة", 24, 50.00m, "622300123999", true),
                new ProductUnitInputDto("شريط", 12, 25.00m, null, false),
                new ProductUnitInputDto("قرص", 1, 2.50m, null, false)
            ]
        );

        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validator_InvalidUnitData_FailsValidation()
    {
        var command = new CreateProductCommand(
            Barcode: "622300123999",
            NameAr: "بانادول إكسترا",
            NameEn: null,
            CategoryId: Guid.NewGuid(),
            BrandId: Guid.NewGuid(),
            SellingPrice: 50.00m,
            Units:
            [
                new ProductUnitInputDto("", 0, -5m, null, false) // Invalid name, factor, price
            ]
        );

        var result = _validator.TestValidate(command);
        Assert.False(result.IsValid);
        Assert.True(result.Errors.Count >= 3);
    }
}

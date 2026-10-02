namespace RetailHub.Application.Features.ProductUnits.DTOs;

public class ProductUnitDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string Name { get; init; } = string.Empty;
    public int ConversionFactor { get; init; }
    public decimal SalePrice { get; init; }
    public string? Barcode { get; init; }
    public bool IsDefaultSale { get; init; }
}

public record CreateProductUnitRequest(
    string Name,
    int ConversionFactor,
    decimal SalePrice,
    string? Barcode = null,
    bool IsDefaultSale = false);

public record UpdateProductUnitRequest(
    string Name,
    int ConversionFactor,
    decimal SalePrice,
    string? Barcode = null,
    bool IsDefaultSale = false);

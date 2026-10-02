using RetailHub.Application.Common.Helpers;
using RetailHub.Application.Features.ProductUnits.DTOs;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;
using Xunit;

namespace RetailHub.UnitTests.ProductUnits;

public class ProductUnitTests
{
    [Fact]
    public void ProductUnit_Create_SetsPropertiesAndRoundsPrice()
    {
        var productId = Guid.NewGuid();
        var unit = ProductUnit.Create(
            productId: productId,
            name: "علبة",
            conversionFactor: 30,
            salePrice: 150.555m,
            barcode: "1234567890",
            isDefaultSale: true);

        Assert.Equal(productId, unit.ProductId);
        Assert.Equal("علبة", unit.Name);
        Assert.Equal(30, unit.ConversionFactor);
        Assert.Equal(150.56m, unit.SalePrice);
        Assert.Equal("1234567890", unit.Barcode);
        Assert.True(unit.IsDefaultSale);
    }

    [Fact]
    public void ProductUnit_Create_ThrowsOnInvalidArguments()
    {
        var productId = Guid.NewGuid();

        Assert.Throws<ArgumentException>(() =>
            ProductUnit.Create(productId, "", 10, 50m));

        Assert.Throws<ArgumentException>(() =>
            ProductUnit.Create(productId, "شريط", 0, 50m));

        Assert.Throws<ArgumentException>(() =>
            ProductUnit.Create(productId, "شريط", -5, 50m));

        Assert.Throws<ArgumentException>(() =>
            ProductUnit.Create(productId, "شريط", 10, -10m));
    }

    [Fact]
    public void SellByUnit_StockDecreasesByBaseQuantity_AndLineTotalCalculated()
    {
        // Box = 30, Strip = 10, Tablet = 1
        // Stock: 85 boxes (2550 tablets)
        var productId = Guid.NewGuid();
        var warehouseId = Guid.NewGuid();
        var batch = Batch.Create(productId, warehouseId, purchasePrice: 3m, quantity: 2550, expiryDate: DateTime.UtcNow.AddMonths(12));

        var stripUnit = ProductUnit.Create(productId, "شريط", conversionFactor: 10, salePrice: 40.00m);

        // Sell 2 strips
        int sellQuantity = 2;
        int baseQtyToDeduct = sellQuantity * stripUnit.ConversionFactor; // 20 tablets
        Assert.Equal(20, baseQtyToDeduct);

        batch.DeductQuantity(baseQtyToDeduct);
        Assert.Equal(2530, batch.Quantity); // 2550 - 20 = 2530

        var invoiceItem = InvoiceItem.Create(
            invoiceId: Guid.NewGuid(),
            productId: productId,
            batchId: batch.Id,
            quantity: sellQuantity,
            unitPriceAtSale: stripUnit.SalePrice,
            unitCostAtSale: batch.PurchasePrice,
            discountPercentage: 0m,
            unitId: stripUnit.Id,
            unitName: stripUnit.Name,
            conversionFactor: stripUnit.ConversionFactor);

        Assert.Equal(2, invoiceItem.Quantity);
        Assert.Equal(40.00m, invoiceItem.UnitPriceAtSale);
        Assert.Equal(20, invoiceItem.BaseQuantity);
        Assert.Equal(80.00m, invoiceItem.LineTotal); // 2 * 40.00 = 80.00
    }

    [Fact]
    public void SellTablets_AndMixedStockDisplay_FormatsCorrectly()
    {
        // Initial stock 2530 tablets. Sell 3 tablets -> 2527 tablets remaining.
        var productId = Guid.NewGuid();
        var warehouseId = Guid.NewGuid();
        var batch = Batch.Create(productId, warehouseId, purchasePrice: 3m, quantity: 2530, expiryDate: DateTime.UtcNow.AddMonths(12));

        var tabletUnit = ProductUnit.Create(productId, "قرص", conversionFactor: 1, salePrice: 4.50m);
        int sellQty = 3;
        int baseQty = sellQty * tabletUnit.ConversionFactor;

        batch.DeductQuantity(baseQty);
        Assert.Equal(2527, batch.Quantity);

        // Units: Box (30), Strip (10), Tablet (1)
        var units = new List<ProductUnitDto>
        {
            new() { Name = "علبة", ConversionFactor = 30, SalePrice = 120m },
            new() { Name = "شريط", ConversionFactor = 10, SalePrice = 40m },
            new() { Name = "قرص", ConversionFactor = 1, SalePrice = 4.50m }
        };

        // 2527 / 30 = 84 boxes (remainder 7). 7 / 10 = 0 strips (remainder 7). 7 / 1 = 7 tablets.
        // Expected: "84 علبة + 7 قرص"
        var display = StockDisplayHelper.FormatMixedStock(batch.Quantity, units);
        Assert.Equal("84 علبة + 7 قرص", display);
    }

    [Fact]
    public void BatchDeduct_ExceedingAvailableStock_ThrowsInvalidOperationException()
    {
        var productId = Guid.NewGuid();
        var batch = Batch.Create(productId, Guid.NewGuid(), 10m, quantity: 15, expiryDate: DateTime.UtcNow.AddMonths(6));

        // Attempting to deduct 20 base units from 15 available
        var ex = Assert.Throws<InvalidOperationException>(() => batch.DeductQuantity(20));
        Assert.Contains("Cannot deduct", ex.Message);
    }

    [Fact]
    public void Return_RestoresStockInBaseUnits()
    {
        var productId = Guid.NewGuid();
        var warehouseId = Guid.NewGuid();
        var batch = Batch.Create(productId, warehouseId, purchasePrice: 5m, quantity: 50, expiryDate: DateTime.UtcNow.AddMonths(12));

        // Customer returns 1 strip (factor = 10)
        var stripUnit = ProductUnit.Create(productId, "شريط", conversionFactor: 10, salePrice: 25m);
        int returnQty = 1;
        int baseQuantityRestored = returnQty * stripUnit.ConversionFactor; // 10 tablets

        batch.AddQuantity(baseQuantityRestored);
        Assert.Equal(60, batch.Quantity); // 50 + 10 = 60
    }

    [Fact]
    public void SingleUnitProduct_MaintainsBackwardCompatibility()
    {
        // Existing single-unit product has factor 1
        var productId = Guid.NewGuid();
        var batch = Batch.Create(productId, Guid.NewGuid(), purchasePrice: 50m, quantity: 10, expiryDate: DateTime.UtcNow.AddMonths(12));

        var defaultUnit = ProductUnit.Create(productId, "علبة", conversionFactor: 1, salePrice: 75m, isDefaultSale: true);

        int sellQty = 3;
        batch.DeductQuantity(sellQty * defaultUnit.ConversionFactor);
        Assert.Equal(7, batch.Quantity);

        var item = InvoiceItem.Create(
            Guid.NewGuid(), productId, batch.Id, sellQty, defaultUnit.SalePrice, batch.PurchasePrice,
            unitId: defaultUnit.Id, unitName: defaultUnit.Name, conversionFactor: defaultUnit.ConversionFactor);

        Assert.Equal(3, item.Quantity);
        Assert.Equal(3, item.BaseQuantity);
        Assert.Equal(225m, item.LineTotal);

        var display = StockDisplayHelper.FormatMixedStock(batch.Quantity, [new() { Name = "علبة", ConversionFactor = 1 }]);
        Assert.Equal("7 علبة", display);
    }

    [Fact]
    public void ChangingUnitPropertiesLater_DoesNotAffectHistoricalInvoiceSnapshots()
    {
        var productId = Guid.NewGuid();
        var batch = Batch.Create(productId, Guid.NewGuid(), 10m, 100, DateTime.UtcNow.AddMonths(12));
        var unit = ProductUnit.Create(productId, "شريط", conversionFactor: 10, salePrice: 30m);

        // Historical sale
        var invoiceItem = InvoiceItem.Create(
            Guid.NewGuid(), productId, batch.Id, quantity: 2, unitPriceAtSale: unit.SalePrice, unitCostAtSale: 10m,
            unitId: unit.Id, unitName: unit.Name, conversionFactor: unit.ConversionFactor);

        Assert.Equal(10, invoiceItem.ConversionFactor);
        Assert.Equal(20, invoiceItem.BaseQuantity);
        Assert.Equal("شريط", invoiceItem.UnitName);
        Assert.Equal(30m, invoiceItem.UnitPriceAtSale);

        // Unit is updated later (e.g. price raised, conversion changed)
        unit.Update("شريط كبير", conversionFactor: 15, salePrice: 50m, barcode: "999", isDefaultSale: false);

        // InvoiceItem snapshots remain untouched
        Assert.Equal(10, invoiceItem.ConversionFactor);
        Assert.Equal(20, invoiceItem.BaseQuantity);
        Assert.Equal("شريط", invoiceItem.UnitName);
        Assert.Equal(30m, invoiceItem.UnitPriceAtSale);
        Assert.Equal(60m, invoiceItem.LineTotal);
    }

    [Fact]
    public void StockDisplayHelper_ZeroStock_ShowsZeroWithSmallestUnit()
    {
        var units = new List<ProductUnitDto>
        {
            new() { Name = "علبة", ConversionFactor = 30 },
            new() { Name = "قرص", ConversionFactor = 1 }
        };

        var display = StockDisplayHelper.FormatMixedStock(0, units);
        Assert.Equal("0 قرص", display);
    }

    [Fact]
    public void SubUnitPricing_AutoCalculatesDefaultPrices_AndAllowsManualOverride()
    {
        // Arrange: Box of 14 tablets, 2 strips, Box Price = 135.00
        decimal boxPrice = 135.00m;
        int totalTablets = 14;
        int totalStrips = 2;

        // Act: Auto calculation
        decimal autoStripPrice = Math.Round(boxPrice / totalStrips, 2, MidpointRounding.AwayFromZero);
        decimal autoTabletPrice = Math.Round(boxPrice / totalTablets, 2, MidpointRounding.AwayFromZero);

        // Assert: Auto default calculations
        Assert.Equal(67.50m, autoStripPrice);
        Assert.Equal(9.64m, autoTabletPrice);

        // Act: Pharmacist applies manual override for tablet price to 10.00
        decimal customTabletPrice = 10.00m;

        var productId = Guid.NewGuid();
        var boxUnit = ProductUnit.Create(productId, "علبة", totalTablets, boxPrice, isDefaultSale: true);
        var stripUnit = ProductUnit.Create(productId, "شريط", totalTablets / totalStrips, autoStripPrice, isDefaultSale: false);
        var tabletUnit = ProductUnit.Create(productId, "قرص", 1, customTabletPrice, isDefaultSale: false);

        // Assert: Units created with correct properties
        Assert.Equal(14, boxUnit.ConversionFactor);
        Assert.Equal(135.00m, boxUnit.SalePrice);
        Assert.True(boxUnit.IsDefaultSale);

        Assert.Equal(7, stripUnit.ConversionFactor);
        Assert.Equal(67.50m, stripUnit.SalePrice);
        Assert.False(stripUnit.IsDefaultSale);

        Assert.Equal(1, tabletUnit.ConversionFactor);
        Assert.Equal(10.00m, tabletUnit.SalePrice);
        Assert.False(tabletUnit.IsDefaultSale);
    }
}

using System.Collections.Generic;
using FluentValidation.TestHelper;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Invoices.Commands.CreateSaleInvoice;
using RetailHub.Application.Features.Invoices.DTOs;
using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;
using Xunit;

namespace RetailHub.UnitTests.Invoices;

public class TestMessagesLocalizer : IStringLocalizer<Messages>
{
    public LocalizedString this[string name] => new(name, name);
    public LocalizedString this[string name, params object[] arguments] => new(name, string.Format(name, arguments));
    public IEnumerable<LocalizedString> GetAllStrings(bool includeParentCultures) => [];
}

public class InvoiceDiscountTests
{
    private readonly CreateSaleInvoiceCommandValidator _validator;

    public InvoiceDiscountTests()
    {
        _validator = new CreateSaleInvoiceCommandValidator(new TestMessagesLocalizer());
    }

    [Fact]
    public void CreateInvoice_WithTenPercentDiscountOn38_CalculatesAndPersistsCorrectDiscountAndTotal()
    {
        // Arrange: 38.00 with 10% discount
        decimal subtotal = 38.00m;
        decimal discountPercent = 10.00m;
        decimal amountPaid = 34.20m;

        // Act
        var invoice = Invoice.Create(
            invoiceNumber: "INV-2026-001",
            subtotal: subtotal,
            discountPercent: discountPercent,
            amountPaid: amountPaid,
            discountReason: "خصم نقدي ترويجي");

        // Assert: 38.00 with 10% -> discount 3.80, total 34.20, all persisted
        Assert.Equal(38.00m, invoice.Subtotal);
        Assert.Equal(10.00m, invoice.DiscountPercent);
        Assert.Equal(3.80m, invoice.DiscountAmount);
        Assert.Equal(34.20m, invoice.TotalAmount);
        Assert.Equal(34.20m, invoice.Total);
        Assert.Equal(PaymentStatus.Paid, invoice.PaymentStatus);
        Assert.Equal("خصم نقدي ترويجي", invoice.DiscountReason);
    }

    [Fact]
    public void CreateInvoice_ZeroPercentDiscount_ProducesZeroDiscountAmountAndTotalEqualsSubtotal()
    {
        // Arrange
        decimal subtotal = 125.50m;
        decimal discountPercent = 0m;
        decimal amountPaid = 125.50m;

        // Act
        var invoice = Invoice.Create("INV-2026-002", subtotal, discountPercent, amountPaid);

        // Assert: 0% discount -> discount 0.00, total equals subtotal
        Assert.Equal(125.50m, invoice.Subtotal);
        Assert.Equal(0.00m, invoice.DiscountPercent);
        Assert.Equal(0.00m, invoice.DiscountAmount);
        Assert.Equal(125.50m, invoice.TotalAmount);
        Assert.Equal(invoice.Subtotal, invoice.TotalAmount);
    }

    [Fact]
    public void CreateInvoice_HundredPercentDiscount_ResultsInZeroTotalAndPaidStatus()
    {
        // Arrange: 100% discount
        decimal subtotal = 200.00m;
        decimal discountPercent = 100m;
        decimal amountPaid = 0m;

        // Act
        var invoice = Invoice.Create("INV-2026-003", subtotal, discountPercent, amountPaid);

        // Assert: 100% -> total 0.00 (allowed only with permission); payment status paid
        Assert.Equal(200.00m, invoice.Subtotal);
        Assert.Equal(200.00m, invoice.DiscountAmount);
        Assert.Equal(0.00m, invoice.TotalAmount);
        Assert.Equal(PaymentStatus.Paid, invoice.PaymentStatus);
    }

    [Theory]
    [InlineData(-5)]
    [InlineData(101)]
    public void CreateInvoice_InvalidPercent_ThrowsArgumentException(decimal invalidPercent)
    {
        // Act & Assert: >100% or negative -> validation error
        Assert.Throws<ArgumentException>(() =>
            Invoice.Create("INV-INVALID", 100m, invalidPercent, 100m));
    }

    [Fact]
    public void Validator_CashierAboveMaxPercentWithoutPermission_IsRejected()
    {
        // Arrange: 15% discount without manager approval
        var command = new CreateSaleInvoiceCommand(
            Items: [new SaleItemRequest(Guid.NewGuid(), 1)],
            AmountPaid: 85m,
            DiscountPercent: 15m,
            IsManagerApproved: false);

        // Act
        var result = _validator.TestValidate(command);

        // Assert: rejected
        result.ShouldHaveValidationErrorFor(x => x);
    }

    [Fact]
    public void Validator_CashierAboveMaxPercentWithManagerApproval_IsAccepted()
    {
        // Arrange: 20% discount WITH manager approval
        var command = new CreateSaleInvoiceCommand(
            Items: [new SaleItemRequest(Guid.NewGuid(), 1)],
            AmountPaid: 80m,
            DiscountPercent: 20m,
            IsManagerApproved: true);

        // Act
        var result = _validator.TestValidate(command);

        // Assert: accepted
        result.ShouldNotHaveValidationErrorFor(x => x);
    }

    [Fact]
    public void Validator_CashierWithinDefaultTenPercent_IsAcceptedWithoutManagerApproval()
    {
        // Arrange: 10% discount without manager approval (allowed)
        var command = new CreateSaleInvoiceCommand(
            Items: [new SaleItemRequest(Guid.NewGuid(), 1)],
            AmountPaid: 90m,
            DiscountPercent: 10m,
            IsManagerApproved: false);

        // Act
        var result = _validator.TestValidate(command);

        // Assert: accepted
        result.ShouldNotHaveValidationErrorFor(x => x);
    }

    [Fact]
    public void InvoiceItem_CalculatesDiscountAmountAndLineTotalCorrectly()
    {
        // Arrange: 2 units at 25.00 each with 10% discount -> subtotal 50.00, discount 5.00, total 45.00
        var item = InvoiceItem.Create(
            invoiceId: Guid.NewGuid(),
            productId: Guid.NewGuid(),
            batchId: Guid.NewGuid(),
            quantity: 2,
            unitPriceAtSale: 25.00m,
            unitCostAtSale: 15.00m,
            discountPercentage: 10.00m);

        // Assert
        Assert.Equal(5.00m, item.DiscountAmount);
        Assert.Equal(22.50m, item.NetUnitPrice);
        Assert.Equal(45.00m, item.LineTotal);
    }
}

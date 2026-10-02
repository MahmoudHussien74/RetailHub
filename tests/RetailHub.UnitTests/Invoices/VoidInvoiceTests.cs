using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;
using Xunit;

namespace RetailHub.UnitTests.Invoices;

public class VoidInvoiceTests
{
    [Fact]
    public void VoidInvoice_MarksIsVoidedTrue()
    {
        // Arrange
        var invoice = Invoice.Create("INV-001", 100m, 0m, 100m);

        // Act
        invoice.Void();

        // Assert
        Assert.True(invoice.IsVoided);
    }

    [Fact]
    public void VoidInvoice_AlreadyVoided_ThrowsInvalidOperationException()
    {
        // Arrange
        var invoice = Invoice.Create("INV-001", 100m, 0m, 100m);
        invoice.Void();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => invoice.Void());
    }

    [Fact]
    public void CashDrawerTransaction_ForVoidInvoice_CreatesOutflowReturnTransaction()
    {
        // Arrange
        var invoiceId = Guid.NewGuid();
        var amountPaid = 150.50m;

        // Act
        var transaction = CashDrawerTransaction.Create(
            CashDrawerTransactionType.Return,
            -amountPaid,
            referenceId: invoiceId,
            notes: "إلغاء فاتورة بيع رقم INV-001");

        // Assert
        Assert.Equal(CashDrawerTransactionType.Return, transaction.Type);
        Assert.Equal(-150.50m, transaction.Amount);
        Assert.Equal(invoiceId, transaction.ReferenceId);
        Assert.Contains("INV-001", transaction.Notes);
    }
}

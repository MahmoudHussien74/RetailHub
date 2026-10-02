using RetailHub.Domain.Entities;
using RetailHub.Domain.Enums;
using Xunit;

namespace RetailHub.UnitTests.Shifts;

public class ShiftClosingTests
{
    [Fact]
    public void CloseShift_ShortageCase_CalculatesNegativeDifferenceAndShortageStatus()
    {
        // Arrange: Opening 0, in 1006.20, out 900.00, actual 105.00
        var shift = Shift.Start("Ahmed", openingBalance: 0m);

        // Act
        shift.Close(actualCash: 105.00m, totalCashIn: 1006.20m, totalCashOut: 900.00m);

        // Assert
        Assert.Equal(106.20m, shift.ExpectedCash);
        Assert.Equal(-1.20m, shift.Difference);
        Assert.Equal(ShiftStatus.Shortage, shift.Status);
        Assert.False(shift.IsOpen);
    }

    [Fact]
    public void CloseShift_ExactMatchCase_CalculatesZeroDifferenceAndMatchStatus()
    {
        // Arrange
        var shift = Shift.Start("Ahmed", openingBalance: 0m);

        // Act: Actual 106.20
        shift.Close(actualCash: 106.20m, totalCashIn: 1006.20m, totalCashOut: 900.00m);

        // Assert
        Assert.Equal(106.20m, shift.ExpectedCash);
        Assert.Equal(0.00m, shift.Difference);
        Assert.Equal(ShiftStatus.Match, shift.Status);
    }

    [Fact]
    public void CloseShift_SurplusCase_CalculatesPositiveDifferenceAndSurplusStatus()
    {
        // Arrange
        var shift = Shift.Start("Ahmed", openingBalance: 0m);

        // Act: Actual 110.00
        shift.Close(actualCash: 110.00m, totalCashIn: 1006.20m, totalCashOut: 900.00m);

        // Assert
        Assert.Equal(106.20m, shift.ExpectedCash);
        Assert.Equal(3.80m, shift.Difference);
        Assert.Equal(ShiftStatus.Surplus, shift.Status);
    }

    [Fact]
    public void CloseShift_OpeningBalanceGreaterThanZero_IncludesOpeningBalanceCorrectly()
    {
        // Arrange: Opening 250.50, In 500.00, Out 150.25 -> Expected = 250.50 + 500.00 - 150.25 = 600.25
        var shift = Shift.Start("Sara", openingBalance: 250.50m);

        // Act: Actual 600.00 -> Shortage of -0.25
        shift.Close(actualCash: 600.00m, totalCashIn: 500.00m, totalCashOut: 150.25m);

        // Assert
        Assert.Equal(250.50m, shift.OpeningBalance);
        Assert.Equal(600.25m, shift.ExpectedCash);
        Assert.Equal(600.00m, shift.ActualCash);
        Assert.Equal(-0.25m, shift.Difference);
        Assert.Equal(ShiftStatus.Shortage, shift.Status);
    }

    [Fact]
    public void CloseShift_OnlyExpensesCase_CalculatesCorrectExpectedBalance()
    {
        // Arrange: Opening 500.00, In 0.00, Out 350.50 -> Expected = 149.50
        var shift = Shift.Start("Sara", openingBalance: 500.00m);

        // Act: Actual 150.00 -> Surplus of 0.50
        shift.Close(actualCash: 150.00m, totalCashIn: 0m, totalCashOut: 350.50m);

        // Assert
        Assert.Equal(149.50m, shift.ExpectedCash);
        Assert.Equal(0.50m, shift.Difference);
        Assert.Equal(ShiftStatus.Surplus, shift.Status);
    }

    [Fact]
    public void CloseShift_DecimalPrecision_ProducesExactResultsWithoutFloatingPointErrors()
    {
        // Arrange: 0.10 + 0.20 style sums (classic IEEE 754 bug check)
        decimal opening = 0.10m;
        decimal inFlow = 0.20m;
        decimal outFlow = 0.05m;
        // Expected: 0.10 + 0.20 - 0.05 = 0.25
        var shift = Shift.Start("PrecisionTester", opening);

        // Act
        shift.Close(actualCash: 0.25m, totalCashIn: inFlow, totalCashOut: outFlow);

        // Assert
        Assert.Equal(0.25m, shift.ExpectedCash);
        Assert.Equal(0.00m, shift.Difference);
        Assert.Equal(ShiftStatus.Match, shift.Status);
    }
}

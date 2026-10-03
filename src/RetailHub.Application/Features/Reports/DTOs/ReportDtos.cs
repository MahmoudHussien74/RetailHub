namespace RetailHub.Application.Features.Reports.DTOs;

// ── Profit & Loss Report ──

public class ProfitLossReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string PeriodLabel { get; set; } = string.Empty;

    // Revenue
    public decimal TotalSalesRevenue { get; set; }
    public decimal TotalReturnsAmount { get; set; }
    public decimal NetSalesRevenue { get; set; }

    // Cost
    public decimal TotalCostOfGoodsSold { get; set; }

    // Profit
    public decimal GrossProfit { get; set; }
    public decimal GrossProfitMargin { get; set; }

    // Expenses
    public decimal TotalExpenses { get; set; }
    public decimal TotalSalaryAdvances { get; set; }

    // Net
    public decimal NetProfit { get; set; }

    // Breakdown
    public int TotalInvoicesCount { get; set; }
    public int TotalReturnInvoicesCount { get; set; }
    public decimal TotalDiscountsGiven { get; set; }
    public decimal TotalPurchases { get; set; }

    public List<ProfitLossPeriodRow> PeriodBreakdown { get; set; } = [];
}

public class ProfitLossPeriodRow
{
    public string Period { get; set; } = string.Empty;
    public decimal Sales { get; set; }
    public decimal CostOfGoods { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetProfit { get; set; }
}

// ── Sales Report ──

public class SalesReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public decimal TotalSales { get; set; }
    public int TotalInvoices { get; set; }
    public decimal AverageInvoiceAmount { get; set; }

    public List<SalesByProductRow> ByProduct { get; set; } = [];
    public List<SalesByCategoryRow> ByCategory { get; set; } = [];
}

public class SalesByProductRow
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMargin { get; set; }
}

public class SalesByCategoryRow
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal Profit { get; set; }
}

// ── Stock Movement Report ──

public class StockMovementReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalMovements { get; set; }
    public int TotalPurchaseQty { get; set; }
    public int TotalSaleQty { get; set; }
    public int TotalReturnQty { get; set; }
    public int TotalDamageQty { get; set; }
    public int TotalAdjustmentQty { get; set; }
    public List<StockMovementRow> Movements { get; set; } = [];
}

public class StockMovementRow
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string MovementType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime MovementDate { get; set; }
    public int CurrentStock { get; set; }
}

// ── Expenses & Salary Advances Report ──

public class ExpensesReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal TotalSalaryAdvances { get; set; }
    public decimal GrandTotal { get; set; }
    public List<ExpenseRow> Expenses { get; set; } = [];
    public List<SalaryAdvanceRow> SalaryAdvances { get; set; } = [];
}

public class ExpenseRow
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
}

public class SalaryAdvanceRow
{
    public Guid Id { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime AdvanceDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

// ── Best Selling Products ──

public class BestSellingReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<BestSellingProductRow> Products { get; set; } = [];
}

public class BestSellingProductRow
{
    public int Rank { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal Profit { get; set; }
    public int InvoiceAppearances { get; set; }
}

// ── Near-Expiry & Low-Stock Report ──

public class InventoryAlertsReportDto
{
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public int NearExpiryCount { get; set; }
    public int ExpiredCount { get; set; }

    public List<LowStockProductRow> LowStockProducts { get; set; } = [];
    public List<NearExpiryBatchRow> NearExpiryBatches { get; set; } = [];
}

public class LowStockProductRow
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public string StockStatus { get; set; } = string.Empty; // "OutOfStock" | "Low" | "Critical"
}

public class NearExpiryBatchRow
{
    public Guid BatchId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int DaysUntilExpiry { get; set; }
    public string ExpiryStatus { get; set; } = string.Empty; // "Expired" | "Critical" | "Warning"
}

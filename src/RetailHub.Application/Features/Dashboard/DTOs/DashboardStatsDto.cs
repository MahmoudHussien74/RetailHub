namespace RetailHub.Application.Features.Dashboard.DTOs;

public class DashboardStatsDto
{
    public decimal TodaySales { get; set; }
    public int TodayInvoicesCount { get; set; }
    public decimal AverageInvoiceAmount { get; set; }
    public decimal SalesGrowthPercentage { get; set; }
    public decimal CashDrawerBalance { get; set; }
    public int LowStockProductsCount { get; set; }
    public int OutOfStockProductsCount { get; set; }
    public int NearExpiryBatchesCount { get; set; }
    public int TotalProductsCount { get; set; }
    public int TotalCustomersCount { get; set; }
    public List<RecentInvoiceDto> RecentInvoices { get; set; } = [];
}

public class RecentInvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}

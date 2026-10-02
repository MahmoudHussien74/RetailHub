export interface DashboardStatsDto {
  todaySales: number;
  todayInvoicesCount: number;
  averageInvoiceAmount: number;
  salesGrowthPercentage: number;
  cashDrawerBalance: number;
  lowStockProductsCount: number;
  outOfStockProductsCount: number;
  nearExpiryBatchesCount: number;
  totalProductsCount: number;
  totalCustomersCount: number;
  recentInvoices: RecentInvoiceDto[];
}

export interface RecentInvoiceDto {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  paymentStatus: string;
}

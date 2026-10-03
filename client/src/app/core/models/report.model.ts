// ── Report DTOs ──

export interface ProfitLossReportDto {
  fromDate: string;
  toDate: string;
  periodLabel: string;
  totalSalesRevenue: number;
  totalReturnsAmount: number;
  netSalesRevenue: number;
  totalCostOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalExpenses: number;
  totalSalaryAdvances: number;
  netProfit: number;
  totalInvoicesCount: number;
  totalReturnInvoicesCount: number;
  totalDiscountsGiven: number;
  totalPurchases: number;
  periodBreakdown: ProfitLossPeriodRow[];
}

export interface ProfitLossPeriodRow {
  period: string;
  sales: number;
  costOfGoods: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface SalesReportDto {
  fromDate: string;
  toDate: string;
  totalSales: number;
  totalInvoices: number;
  averageInvoiceAmount: number;
  byProduct: SalesByProductRow[];
  byCategory: SalesByCategoryRow[];
}

export interface SalesByProductRow {
  productId: string;
  productName: string;
  barcode: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

export interface SalesByCategoryRow {
  categoryId: string;
  categoryName: string;
  productCount: number;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
}

export interface StockMovementReportDto {
  fromDate: string;
  toDate: string;
  totalMovements: number;
  totalPurchaseQty: number;
  totalSaleQty: number;
  totalReturnQty: number;
  totalDamageQty: number;
  totalAdjustmentQty: number;
  movements: StockMovementRow[];
}

export interface StockMovementRow {
  productId: string;
  productName: string;
  barcode: string;
  movementType: string;
  quantity: number;
  movementDate: string;
  currentStock: number;
}

export interface ExpensesReportDto {
  fromDate: string;
  toDate: string;
  totalExpenses: number;
  totalSalaryAdvances: number;
  grandTotal: number;
  expenses: ExpenseRow[];
  salaryAdvances: SalaryAdvanceRow[];
}

export interface ExpenseRow {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface SalaryAdvanceRow {
  id: string;
  employeeName: string;
  amount: number;
  advanceDate: string;
  status: string;
  notes?: string;
}

export interface BestSellingReportDto {
  fromDate: string;
  toDate: string;
  products: BestSellingProductRow[];
}

export interface BestSellingProductRow {
  rank: number;
  productId: string;
  productName: string;
  barcode: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  profit: number;
  invoiceAppearances: number;
}

export interface InventoryAlertsReportDto {
  lowStockCount: number;
  outOfStockCount: number;
  nearExpiryCount: number;
  expiredCount: number;
  lowStockProducts: LowStockProductRow[];
  nearExpiryBatches: NearExpiryBatchRow[];
}

export interface LowStockProductRow {
  productId: string;
  productName: string;
  barcode: string;
  categoryName: string;
  currentStock: number;
  stockStatus: string;
}

export interface NearExpiryBatchRow {
  batchId: string;
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  expiryDate: string;
  daysUntilExpiry: number;
  expiryStatus: string;
}

// ── Return Invoice Models ──

export interface ReturnInvoiceListDto {
  id: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerId?: string;
  customerName?: string;
  totalRefundAmount: number;
  itemCount: number;
  returnDate: string;
}

export interface ReturnInvoiceDetailDto {
  id: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerId?: string;
  customerName?: string;
  totalRefundAmount: number;
  returnDate: string;
  items: ReturnInvoiceItemDto[];
}

export interface ReturnInvoiceItemDto {
  id: string;
  productId: string;
  productNameAr: string;
  productNameEn?: string;
  batchId: string;
  quantity: number;
  unitPriceAtSale: number;
  lineTotal: number;
  isDamaged: boolean;
}

export interface CreateReturnRequest {
  originalInvoiceId: string;
  items: ReturnItemRequest[];
}

export interface ReturnItemRequest {
  invoiceItemId: string;
  quantity: number;
  isDamaged: boolean;
}

// ── Payment Models ──

export interface PaymentListDto {
  id: string;
  customerId: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}

export interface CreatePaymentDto {
  customerId: string;
  amount: number;
  invoiceId?: string;
  notes?: string;
}

// ── Stock Movement Models ──

export interface StockMovementDto {
  id: string;
  productId: string;
  batchId: string;
  type: string;
  quantity: number;
  movementDate: string;
  referenceId?: string;
  isVoided: boolean;
}

// ── Cash Drawer Models ──

export interface CashDrawerTransactionDto {
  id: string;
  transactionDate: string;
  type: string;
  amount: number;
  referenceId?: string;
  notes?: string;
}

export interface DailySummaryDto {
  date: string;
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  transactionCount: number;
  totalDiscounts?: number;
}

export interface RecordCashDrawerTransactionDto {
  type: 'Sale' | 'Return' | 'SalaryAdvance' | 'Expense';
  amount: number;
  referenceId?: string;
  notes?: string;
}

// ── Employee Models ──

export interface EmployeeListDto {
  id: string;
  name: string;
  phone?: string;
  role?: string;
  baseSalary: number;
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeDetailDto extends EmployeeListDto {
  updatedAt?: string;
}

export interface CreateEmployeeDto {
  name: string;
  baseSalary: number;
  phone?: string;
  role?: string;
}

export interface UpdateEmployeeDto extends CreateEmployeeDto {
  id: string;
}

// ── Salary Advance Models ──

export interface SalaryAdvanceListDto {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  advanceDate: string;
  status: 'Pending' | 'Deducted';
  notes?: string;
}

export interface RecordAdvanceDto {
  employeeId: string;
  amount: number;
  deductFromCashDrawer: boolean;
  notes?: string;
}

// ── Warehouse Models ──

export interface WarehouseDto {
  id: string;
  name: string;
  address?: string;
  isDefault: boolean;
}

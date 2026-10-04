// ── Invoice Models ──

export interface InvoiceListDto {
  id: string;
  invoiceNumber: string;
  paymentStatus: 'Paid' | 'Partial' | 'Credit';
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  total: number;
  amountPaid: number;
  itemCount: number;
  isVoided: boolean;
  hasReturns?: boolean;
  totalRefunded?: number;
  isFullyReturned?: boolean;
  createdAt: string;
}

export interface InvoiceDetailDto {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  paymentStatus: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  total: number;
  amountPaid: number;
  discountReason?: string;
  discountedByUserId?: string;
  isVoided: boolean;
  hasReturns?: boolean;
  totalRefunded?: number;
  isFullyReturned?: boolean;
  createdAt: string;
  items: InvoiceItemDto[];
}

export interface InvoiceItemDto {
  id: string;
  productId: string;
  productNameAr: string;
  productNameEn?: string;
  batchId: string;
  quantity: number;
  returnedQuantity?: number;
  remainingReturnableQuantity?: number;
  unitId?: string;
  unitName?: string;
  conversionFactor?: number;
  baseQuantity?: number;
  unitPriceAtSale: number;
  unitCostAtSale: number;
  discountPercentage: number;
  discountAmount: number;
  lineTotal: number;
  netUnitPrice?: number;
}

// ── Create Sale Request ──

export interface CreateSaleRequest {
  items: SaleItemRequest[];
  amountPaid: number;
  customerId?: string;
  discountPercent?: number;
  discountReason?: string;
  discountedByUserId?: string;
  isManagerApproved?: boolean;
}

export interface SaleItemRequest {
  productId: string;
  quantity: number;
  unitId?: string;
}

export interface DiscountReportDto {
  invoiceId: string;
  invoiceNumber: string;
  createdAt: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  discountReason?: string;
  discountedByUserName: string;
}

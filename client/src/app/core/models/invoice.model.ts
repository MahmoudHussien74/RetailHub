// ── Invoice Models ──

export interface InvoiceListDto {
  id: string;
  invoiceNumber: string;
  paymentStatus: 'Paid' | 'Partial' | 'Credit';
  totalAmount: number;
  amountPaid: number;
  itemCount: number;
  isVoided: boolean;
  createdAt: string;
}

export interface InvoiceDetailDto {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  paymentStatus: string;
  totalAmount: number;
  amountPaid: number;
  isVoided: boolean;
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
  unitPriceAtSale: number;
  unitCostAtSale: number;
  lineTotal: number;
}

// ── Create Sale Request ──

export interface CreateSaleRequest {
  items: SaleItemRequest[];
  amountPaid: number;
  customerId?: string;
}

export interface SaleItemRequest {
  productId: string;
  quantity: number;
}

// ── Supplier Models ──

export interface SupplierListDto {
  id: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierDetailDto extends SupplierListDto {
  address?: string;
  purchaseInvoiceCount: number;
}

export interface CreateSupplierDto {
  name: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplierDto extends CreateSupplierDto {
  id: string;
}

// ── Purchase Invoice Models ──

export interface PurchaseInvoiceListDto {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  itemCount: number;
  purchaseDate: string;
}

export interface PurchaseInvoiceDetailDto extends PurchaseInvoiceListDto {
  notes?: string;
  createdAt: string;
  items: PurchaseInvoiceItemDto[];
}

export interface PurchaseInvoiceItemDto {
  id: string;
  productId: string;
  productNameAr: string;
  productNameEn?: string;
  quantity: number;
  unitCost: number;
  sellingPrice?: number;
  lineTotal: number;
  expiryDate: string;
  batchId: string;
}

export interface CreatePurchaseRequest {
  supplierId: string;
  purchaseDate: string;
  notes?: string;
  items: PurchaseItemRequest[];
}

export interface PurchaseItemRequest {
  productId: string;
  quantity: number;
  unitCost: number;
  newSellingPrice?: number;
  expiryDate: string;
}

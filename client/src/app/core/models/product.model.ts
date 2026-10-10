// ── Product Unit Models ──

export interface ProductUnitDto {
  id: string;
  productId: string;
  name: string;
  conversionFactor: number;
  salePrice: number;
  barcode?: string;
  isDefaultSale: boolean;
}

export interface CreateProductUnitRequest {
  name: string;
  conversionFactor: number;
  salePrice: number;
  barcode?: string;
  isDefaultSale?: boolean;
}

export interface UpdateProductUnitRequest {
  name: string;
  conversionFactor: number;
  salePrice: number;
  barcode?: string;
  isDefaultSale?: boolean;
}

// ── Product Models ──

export interface ProductListDto {
  id: string;
  barcode: string;
  nameAr: string;
  nameEn?: string;
  categoryNameAr: string;
  categoryNameEn?: string;
  brandNameAr: string;
  brandNameEn?: string;
  sellingPrice: number;
  averageCost: number;
  totalStock: number;
  stockDisplay?: string;
  units?: ProductUnitDto[];
}

export interface ProductDetailDto extends ProductListDto {
  categoryId: string;
  brandId: string;
  isActive: boolean;
  batches: BatchDto[];
}

export interface CreateProductDto {
  barcode?: string | null;
  nameAr: string;
  nameEn?: string;
  categoryId: string;
  brandId: string;
  sellingPrice: number;
  purchasePrice?: number;
  initialStock?: number;
  expiryDate?: string;
  units?: CreateProductUnitRequest[];
}

export interface UpdateProductDto {
  barcode?: string | null;
  nameAr: string;
  nameEn?: string;
  categoryId: string;
  brandId: string;
}

// ── Batch Models ──

export interface BatchDto {
  id: string;
  productId: string;
  warehouseId: string;
  purchasePrice: number;
  quantity: number;
  expiryDate: string;
  createdAt: string;
}

export interface AddBatchDto {
  warehouseId: string;
  purchasePrice: number;
  quantity: number;
  expiryDate: string;
  supplierId?: string;
}

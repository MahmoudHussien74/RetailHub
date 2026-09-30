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
}

export interface ProductDetailDto extends ProductListDto {
  categoryId: string;
  brandId: string;
  isActive: boolean;
  batches: BatchDto[];
}

export interface CreateProductDto {
  barcode: string;
  nameAr: string;
  nameEn?: string;
  categoryId: string;
  brandId: string;
  sellingPrice: number;
}

export interface UpdateProductDto {
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

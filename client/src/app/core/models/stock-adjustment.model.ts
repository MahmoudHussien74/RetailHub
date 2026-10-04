import { PagedResult } from './api-response.model';

export interface StockAdjustmentDto {
  id: string;
  productId: string;
  productNameAr: string;
  barcode: string;
  batchId: string;
  batchExpiryDate: string;
  /** "Damage" (write-off) or "Adjustment" (stock-take). */
  type: 'Damage' | 'Adjustment';
  /** Base units. Damage: removed (positive). Adjustment: signed. */
  quantity: number;
  unitCost: number;
  /** Negative = loss, positive = surplus. */
  valueImpact: number;
  notes?: string;
  movementDate: string;
}

export interface StockAdjustmentSummaryDto {
  totalLoss: number;
  totalSurplus: number;
  writeOffCount: number;
  adjustmentCount: number;
}

export interface StockAdjustmentListDto {
  summary: StockAdjustmentSummaryDto;
  page: PagedResult<StockAdjustmentDto>;
}

export interface AdjustStockRequest {
  productId: string;
  batchId: string;
  /** Base units: units to remove (write-off) or the physically counted quantity (count). */
  quantity: number;
  reason: string;
}

export interface BatchOptionDto {
  id: string;
  productId: string;
  purchasePrice: number;
  quantity: number;
  expiryDate: string;
}

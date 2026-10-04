import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, PagedResult } from '../models/api-response.model';
import {
  AdjustStockRequest,
  BatchOptionDto,
  StockAdjustmentListDto
} from '../models/stock-adjustment.model';

@Injectable({ providedIn: 'root' })
export class StockAdjustmentsService {
  private api = inject(ApiService);
  private readonly path = 'stock-adjustments';

  getAll(params?: { page?: number; pageSize?: number; from?: string; to?: string }):
    Observable<ApiResponse<StockAdjustmentListDto>> {
    return this.api.get(this.path, params);
  }

  writeOff(req: AdjustStockRequest): Observable<ApiResponse<string>> {
    return this.api.post(`${this.path}/write-off`, req);
  }

  count(req: AdjustStockRequest): Observable<ApiResponse<string>> {
    return this.api.post(`${this.path}/count`, req);
  }

  /** Batches that still have stock for a product (earliest expiry first). */
  getBatches(productId: string): Observable<ApiResponse<PagedResult<BatchOptionDto>>> {
    return this.api.get(`products/${productId}/batches`, { pageSize: 100 });
  }
}

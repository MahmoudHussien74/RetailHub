import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CashDrawerTransactionDto, DailySummaryDto, RecordCashDrawerTransactionDto
} from '../models/operational.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class CashDrawerService {
  private readonly path = 'cash-drawer';

  constructor(private api: ApiService) {}

  getTransactions(date: string, page = 1, pageSize = 20): Observable<ApiResponse<PagedResult<CashDrawerTransactionDto>>> {
    return this.api.get(`${this.path}/transactions`, { date, page, pageSize });
  }

  getDailySummary(date: string): Observable<ApiResponse<DailySummaryDto>> {
    return this.api.get(`${this.path}/summary`, { date });
  }

  recordTransaction(dto: RecordCashDrawerTransactionDto): Observable<ApiResponse<string>> {
    return this.api.post(`${this.path}/transactions`, dto);
  }
}

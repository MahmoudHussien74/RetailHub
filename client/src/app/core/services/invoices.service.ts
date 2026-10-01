import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { InvoiceListDto, InvoiceDetailDto, CreateSaleRequest } from '../models/invoice.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly path = 'invoices';

  constructor(private api: ApiService) {}

  getAll(params?: {
    pageNumber?: number;
    pageSize?: number;
    paymentStatus?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<ApiResponse<PagedResult<InvoiceListDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<InvoiceDetailDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  create(request: CreateSaleRequest): Observable<ApiResponse<string>> {
    return this.api.post(this.path, request);
  }

  void(id: string): Observable<ApiResponse<void>> {
    return this.api.post(`${this.path}/${id}/void`, {});
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ReturnInvoiceListDto, ReturnInvoiceDetailDto, CreateReturnRequest,
  PaymentListDto, CreatePaymentDto
} from '../models/operational.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ReturnInvoicesService {
  private readonly path = 'returninvoices';

  constructor(private api: ApiService) {}

  getAll(params?: {
    page?: number;
    pageSize?: number;
  }): Observable<ApiResponse<PagedResult<ReturnInvoiceListDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<ReturnInvoiceDetailDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  create(request: CreateReturnRequest): Observable<ApiResponse<string>> {
    return this.api.post(this.path, request);
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly path = 'payments';

  constructor(private api: ApiService) {}

  getByCustomer(customerId: string): Observable<ApiResponse<PaymentListDto[]>> {
    return this.api.get(this.path, { customerId });
  }

  create(dto: CreatePaymentDto): Observable<ApiResponse<string>> {
    return this.api.post(this.path, dto);
  }
}

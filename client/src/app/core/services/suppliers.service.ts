import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  SupplierListDto, SupplierDetailDto, CreateSupplierDto, UpdateSupplierDto,
  PurchaseInvoiceListDto, PurchaseInvoiceDetailDto, CreatePurchaseRequest
} from '../models/purchase.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly path = 'suppliers';

  constructor(private api: ApiService) {}

  getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Observable<ApiResponse<PagedResult<SupplierListDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<SupplierDetailDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  create(dto: CreateSupplierDto): Observable<ApiResponse<string>> {
    return this.api.post(this.path, dto);
  }

  update(id: string, dto: UpdateSupplierDto): Observable<ApiResponse<void>> {
    return this.api.put(`${this.path}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.path}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PurchaseInvoicesService {
  private readonly path = 'purchaseinvoices';

  constructor(private api: ApiService) {}

  getAll(params?: {
    page?: number;
    pageSize?: number;
    supplierId?: string;
  }): Observable<ApiResponse<PagedResult<PurchaseInvoiceListDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<PurchaseInvoiceDetailDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  create(request: CreatePurchaseRequest): Observable<ApiResponse<string>> {
    return this.api.post(this.path, request);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CustomerListDto, CustomerDetailDto, CreateCustomerDto, UpdateCustomerDto } from '../models/customer.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly path = 'customers';

  constructor(private api: ApiService) {}

  getAll(params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
  }): Observable<ApiResponse<PagedResult<CustomerListDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<CustomerDetailDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  create(dto: CreateCustomerDto): Observable<ApiResponse<string>> {
    return this.api.post(this.path, dto);
  }

  update(id: string, dto: UpdateCustomerDto): Observable<ApiResponse<void>> {
    return this.api.put(`${this.path}/${id}`, dto);
  }
}

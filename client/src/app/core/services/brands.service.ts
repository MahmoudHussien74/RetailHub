import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BrandDto, CreateBrandDto, UpdateBrandDto } from '../models/category-brand.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BrandsService {
  private readonly path = 'brands';

  constructor(private api: ApiService) {}

  getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Observable<ApiResponse<PagedResult<BrandDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<BrandDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  create(dto: CreateBrandDto): Observable<ApiResponse<string>> {
    return this.api.post(this.path, dto);
  }

  update(id: string, dto: UpdateBrandDto): Observable<ApiResponse<void>> {
    return this.api.put(`${this.path}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.path}/${id}`);
  }
}

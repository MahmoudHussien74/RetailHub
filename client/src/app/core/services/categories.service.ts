import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../models/category-brand.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly path = 'categories';

  constructor(private api: ApiService) {}

  getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Observable<ApiResponse<PagedResult<CategoryDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<CategoryDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  create(dto: CreateCategoryDto): Observable<ApiResponse<string>> {
    return this.api.post(this.path, dto);
  }

  update(id: string, dto: UpdateCategoryDto): Observable<ApiResponse<void>> {
    return this.api.put(`${this.path}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.path}/${id}`);
  }
}

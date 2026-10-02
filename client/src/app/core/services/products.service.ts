import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ProductListDto, ProductDetailDto, CreateProductDto, UpdateProductDto, ProductUnitDto, CreateProductUnitRequest, UpdateProductUnitRequest } from '../models/product.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly path = 'products';

  constructor(private api: ApiService) {}

  getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    lowStockOnly?: boolean;
    stockStatus?: 'all' | 'inStock' | 'lowStock' | 'outOfStock';
  }): Observable<ApiResponse<PagedResult<ProductListDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<ProductDetailDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  getByBarcode(barcode: string): Observable<ApiResponse<ProductDetailDto>> {
    return this.api.get(`${this.path}/barcode/${barcode}`);
  }

  create(dto: CreateProductDto): Observable<ApiResponse<string>> {
    return this.api.post(this.path, dto);
  }

  update(id: string, dto: UpdateProductDto): Observable<ApiResponse<void>> {
    return this.api.put(`${this.path}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.path}/${id}`);
  }

  addUnit(productId: string, request: CreateProductUnitRequest): Observable<ApiResponse<ProductUnitDto>> {
    return this.api.post(`${this.path}/${productId}/units`, request);
  }

  updateUnit(productId: string, unitId: string, request: UpdateProductUnitRequest): Observable<ApiResponse<ProductUnitDto>> {
    return this.api.put(`${this.path}/${productId}/units/${unitId}`, request);
  }

  deleteUnit(productId: string, unitId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.path}/${productId}/units/${unitId}`);
  }
}

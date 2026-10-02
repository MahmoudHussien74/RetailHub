import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  EmployeeListDto, EmployeeDetailDto, CreateEmployeeDto, UpdateEmployeeDto,
  SalaryAdvanceListDto, RecordAdvanceDto
} from '../models/operational.model';
import { ApiResponse, PagedResult } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private readonly path = 'employees';

  constructor(private api: ApiService) {}

  getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }): Observable<ApiResponse<PagedResult<EmployeeListDto>>> {
    return this.api.get(this.path, params);
  }

  getById(id: string): Observable<ApiResponse<EmployeeDetailDto>> {
    return this.api.get(`${this.path}/${id}`);
  }

  create(dto: CreateEmployeeDto): Observable<ApiResponse<string>> {
    return this.api.post(this.path, dto);
  }

  update(id: string, dto: UpdateEmployeeDto): Observable<ApiResponse<void>> {
    return this.api.put(`${this.path}/${id}`, dto);
  }
}

@Injectable({ providedIn: 'root' })
export class SalaryAdvancesService {
  private readonly path = 'salaryadvances';

  constructor(private api: ApiService) {}

  getAll(params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    status?: string;
  }): Observable<ApiResponse<PagedResult<SalaryAdvanceListDto>>> {
    return this.api.get(this.path, params);
  }

  getByEmployee(employeeId: string, page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<SalaryAdvanceListDto>>> {
    return this.api.get(`${this.path}/employee/${employeeId}`, { page, pageSize });
  }

  record(dto: RecordAdvanceDto): Observable<ApiResponse<string>> {
    return this.api.post(this.path, dto);
  }

  deduct(advanceId: string): Observable<ApiResponse<void>> {
    return this.api.patch(`${this.path}/${advanceId}/deduct`, {});
  }
}

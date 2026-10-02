import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { ShiftDto, CloseShiftRequest, StartShiftRequest } from '../models/shift.model';

@Injectable({ providedIn: 'root' })
export class ShiftsService {
  private api = inject(ApiService);
  private readonly path = 'shifts';

  getCurrentShift(cashierId?: string): Observable<ApiResponse<ShiftDto>> {
    const params = cashierId ? { cashierId } : undefined;
    return this.api.get<ApiResponse<ShiftDto>>(`${this.path}/current`, params);
  }

  startShift(request: StartShiftRequest): Observable<ApiResponse<ShiftDto>> {
    return this.api.post<ApiResponse<ShiftDto>>(`${this.path}/start`, request);
  }

  closeShift(request: CloseShiftRequest): Observable<ApiResponse<ShiftDto>> {
    return this.api.post<ApiResponse<ShiftDto>>(`${this.path}/close`, request);
  }

  getShiftById(id: string): Observable<ApiResponse<ShiftDto>> {
    return this.api.get<ApiResponse<ShiftDto>>(`${this.path}/${id}`);
  }
}

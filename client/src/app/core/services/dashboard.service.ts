import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { DashboardStatsDto } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = inject(ApiService);

  getStats(): Observable<ApiResponse<DashboardStatsDto>> {
    return this.api.get<ApiResponse<DashboardStatsDto>>('dashboard/stats');
  }
}

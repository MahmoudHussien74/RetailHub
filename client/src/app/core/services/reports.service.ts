import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import {
  ProfitLossReportDto,
  SalesReportDto,
  StockMovementReportDto,
  ExpensesReportDto,
  BestSellingReportDto,
  InventoryAlertsReportDto
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private api = inject(ApiService);

  getProfitLoss(fromDate: string, toDate: string, granularity = 'daily'): Observable<ApiResponse<ProfitLossReportDto>> {
    return this.api.get<ApiResponse<ProfitLossReportDto>>(
      `reports/profit-loss?fromDate=${fromDate}&toDate=${toDate}&granularity=${granularity}`
    );
  }

  getSales(fromDate: string, toDate: string): Observable<ApiResponse<SalesReportDto>> {
    return this.api.get<ApiResponse<SalesReportDto>>(
      `reports/sales?fromDate=${fromDate}&toDate=${toDate}`
    );
  }

  getStockMovements(fromDate: string, toDate: string, productId?: string): Observable<ApiResponse<StockMovementReportDto>> {
    let url = `reports/stock-movements?fromDate=${fromDate}&toDate=${toDate}`;
    if (productId) url += `&productId=${productId}`;
    return this.api.get<ApiResponse<StockMovementReportDto>>(url);
  }

  getExpenses(fromDate: string, toDate: string): Observable<ApiResponse<ExpensesReportDto>> {
    return this.api.get<ApiResponse<ExpensesReportDto>>(
      `reports/expenses?fromDate=${fromDate}&toDate=${toDate}`
    );
  }

  getBestSelling(fromDate: string, toDate: string, top = 20): Observable<ApiResponse<BestSellingReportDto>> {
    return this.api.get<ApiResponse<BestSellingReportDto>>(
      `reports/best-selling?fromDate=${fromDate}&toDate=${toDate}&top=${top}`
    );
  }

  getInventoryAlerts(lowStockThreshold = 10, nearExpiryDays = 30): Observable<ApiResponse<InventoryAlertsReportDto>> {
    return this.api.get<ApiResponse<InventoryAlertsReportDto>>(
      `reports/inventory-alerts?lowStockThreshold=${lowStockThreshold}&nearExpiryDays=${nearExpiryDays}`
    );
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../core/services/reports.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  ProfitLossReportDto, SalesReportDto, StockMovementReportDto,
  ExpensesReportDto, BestSellingReportDto, InventoryAlertsReportDto
} from '../../core/models/report.model';

type ReportTab = 'profit-loss' | 'sales' | 'stock' | 'expenses' | 'best-selling' | 'alerts';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black flex items-center gap-2">
              <svg class="w-7 h-7 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              التقارير والإحصائيات
            </h2>
            <p class="text-violet-200 text-sm mt-1">تحليل شامل لأداء المتجر — الأرباح، المبيعات، المخزون والمصاريف</p>
          </div>
          <button (click)="exportCurrentReport()" class="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm self-start">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            تصدير Excel
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div class="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 scrollbar-thin">
          @for (tab of tabs; track tab.key) {
            <button
              (click)="setActiveTab(tab.key)"
              [class]="activeTab() === tab.key
                ? 'flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30'
                : 'flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors'">
              <span [innerHTML]="tab.icon"></span>
              {{ tab.label }}
              @if (tab.key === 'alerts' && alertsBadge() > 0) {
                <span class="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">{{ alertsBadge() }}</span>
              }
            </button>
          }
        </div>

        <!-- Date Range Filter (not shown for alerts) -->
        @if (activeTab() !== 'alerts') {
          <div class="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-2">
              <label class="text-sm font-bold text-slate-600 dark:text-slate-400">من:</label>
              <input type="date" [(ngModel)]="fromDate" class="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm font-bold text-slate-600 dark:text-slate-400">إلى:</label>
              <input type="date" [(ngModel)]="toDate" class="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
            </div>
            @if (activeTab() === 'profit-loss') {
              <select [(ngModel)]="granularity" class="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none">
                <option value="daily">يومي</option>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
              </select>
            }
            <div class="flex items-center gap-1">
              <button (click)="setQuickDate('today')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">اليوم</button>
              <button (click)="setQuickDate('week')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">آخر أسبوع</button>
              <button (click)="setQuickDate('month')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">آخر شهر</button>
              <button (click)="setQuickDate('year')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">آخر سنة</button>
            </div>
            <button (click)="loadCurrentReport()" [disabled]="loading()" class="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (loading()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              }
              عرض التقرير
            </button>
          </div>
        }

        <!-- Report Content -->
        <div class="p-5">
          @if (loading()) {
            <div class="flex items-center justify-center py-20">
              <div class="flex flex-col items-center gap-3">
                <svg class="w-10 h-10 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                <span class="text-slate-500 dark:text-slate-400 text-sm font-medium">جارِ تحميل التقرير...</span>
              </div>
            </div>
          } @else {

            <!-- ═══════════ 1. PROFIT & LOSS ═══════════ -->
            @if (activeTab() === 'profit-loss') {
              @if (profitLoss()) {
                <div class="space-y-5">
                  <!-- KPI Cards -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400">صافي المبيعات</p>
                      <p class="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{{ profitLoss()!.netSalesRevenue | number:'1.2-2' }} <span class="text-xs">ج.م</span></p>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p class="text-xs font-bold text-blue-600 dark:text-blue-400">تكلفة البضاعة المباعة</p>
                      <p class="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">{{ profitLoss()!.totalCostOfGoodsSold | number:'1.2-2' }} <span class="text-xs">ج.م</span></p>
                    </div>
                    <div class="p-4 rounded-xl border" [class]="profitLoss()!.grossProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'">
                      <p class="text-xs font-bold" [class]="profitLoss()!.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">إجمالي الربح</p>
                      <p class="text-xl font-black mt-1" [class]="profitLoss()!.grossProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
                        {{ profitLoss()!.grossProfit | number:'1.2-2' }} <span class="text-xs">ج.م</span>
                        <span class="text-xs font-bold mr-1 px-1.5 py-0.5 rounded-full" [class]="profitLoss()!.grossProfitMargin >= 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'">{{ profitLoss()!.grossProfitMargin }}%</span>
                      </p>
                    </div>
                    <div class="p-4 rounded-xl border" [class]="profitLoss()!.netProfit >= 0 ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'">
                      <p class="text-xs font-bold" [class]="profitLoss()!.netProfit >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400'">صافي الربح النهائي</p>
                      <p class="text-xl font-black mt-1" [class]="profitLoss()!.netProfit >= 0 ? 'text-violet-700 dark:text-violet-300' : 'text-red-700 dark:text-red-300'">{{ profitLoss()!.netProfit | number:'1.2-2' }} <span class="text-xs">ج.م</span></p>
                    </div>
                  </div>

                  <!-- Details Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                      <h4 class="font-bold text-slate-700 dark:text-slate-200 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">📈 الإيرادات</h4>
                      <div class="flex justify-between text-sm"><span class="text-slate-500">إجمالي المبيعات</span><span class="font-bold text-slate-800 dark:text-slate-200">{{ profitLoss()!.totalSalesRevenue | number:'1.2-2' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-slate-500">المرتجعات (-)</span><span class="font-bold text-red-500">{{ profitLoss()!.totalReturnsAmount | number:'1.2-2' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-slate-500">الخصومات الممنوحة</span><span class="font-bold text-amber-500">{{ profitLoss()!.totalDiscountsGiven | number:'1.2-2' }}</span></div>
                      <div class="flex justify-between text-sm border-t border-slate-200 dark:border-slate-600 pt-2"><span class="font-bold text-slate-700 dark:text-slate-300">عدد الفواتير</span><span class="font-black text-violet-600">{{ profitLoss()!.totalInvoicesCount }}</span></div>
                    </div>
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                      <h4 class="font-bold text-slate-700 dark:text-slate-200 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">📉 المصاريف</h4>
                      <div class="flex justify-between text-sm"><span class="text-slate-500">تكلفة البضاعة المباعة</span><span class="font-bold text-slate-800 dark:text-slate-200">{{ profitLoss()!.totalCostOfGoodsSold | number:'1.2-2' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-slate-500">مصاريف تشغيلية</span><span class="font-bold text-slate-800 dark:text-slate-200">{{ profitLoss()!.totalExpenses | number:'1.2-2' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-slate-500">سلف الموظفين</span><span class="font-bold text-slate-800 dark:text-slate-200">{{ profitLoss()!.totalSalaryAdvances | number:'1.2-2' }}</span></div>
                      <div class="flex justify-between text-sm border-t border-slate-200 dark:border-slate-600 pt-2"><span class="text-slate-500">إجمالي المشتريات</span><span class="font-bold text-indigo-600">{{ profitLoss()!.totalPurchases | number:'1.2-2' }}</span></div>
                    </div>
                  </div>

                  <!-- Period Breakdown Table -->
                  @if (profitLoss()!.periodBreakdown.length > 0) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">📊 تفاصيل حسب الفترة</h4>
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <tr><th class="p-3 text-right font-bold">الفترة</th><th class="p-3 text-right font-bold">المبيعات</th><th class="p-3 text-right font-bold">التكلفة</th><th class="p-3 text-right font-bold">إجمالي الربح</th></tr>
                          </thead>
                          <tbody>
                            @for (row of profitLoss()!.periodBreakdown; track row.period) {
                              <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td class="p-3 font-bold text-slate-700 dark:text-slate-300"><span dir="ltr" class="font-mono">{{ row.period }}</span></td>
                                <td class="p-3 text-emerald-600 font-bold">{{ row.sales | number:'1.2-2' }}</td>
                                <td class="p-3 text-red-500 font-bold">{{ row.costOfGoods | number:'1.2-2' }}</td>
                                <td class="p-3 font-black" [class]="row.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'">{{ row.grossProfit | number:'1.2-2' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-16 text-slate-400"><p class="text-lg">اختر فترة زمنية واضغط "عرض التقرير"</p></div>
              }
            }

            <!-- ═══════════ 2. SALES REPORT ═══════════ -->
            @if (activeTab() === 'sales') {
              @if (sales()) {
                <div class="space-y-5">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400">إجمالي المبيعات</p>
                      <p class="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{{ sales()!.totalSales | number:'1.2-2' }} <span class="text-xs">ج.م</span></p>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p class="text-xs font-bold text-blue-600 dark:text-blue-400">عدد الفواتير</p>
                      <p class="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">{{ sales()!.totalInvoices }}</p>
                    </div>
                    <div class="bg-violet-50 dark:bg-violet-950/30 p-4 rounded-xl border border-violet-200 dark:border-violet-800">
                      <p class="text-xs font-bold text-violet-600 dark:text-violet-400">متوسط الفاتورة</p>
                      <p class="text-xl font-black text-violet-700 dark:text-violet-300 mt-1">{{ sales()!.averageInvoiceAmount | number:'1.2-2' }} <span class="text-xs">ج.م</span></p>
                    </div>
                  </div>

                  <!-- Sales by Category -->
                  @if (sales()!.byCategory.length > 0) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">📁 المبيعات حسب التصنيف</h4>
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <tr><th class="p-3 text-right font-bold">التصنيف</th><th class="p-3 text-right font-bold">عدد الأصناف</th><th class="p-3 text-right font-bold">الكمية المباعة</th><th class="p-3 text-right font-bold">الإيرادات</th><th class="p-3 text-right font-bold">التكلفة</th><th class="p-3 text-right font-bold">الربح</th></tr>
                          </thead>
                          <tbody>
                            @for (row of sales()!.byCategory; track row.categoryId) {
                              <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td class="p-3 font-bold text-slate-700 dark:text-slate-300">{{ row.categoryName }}</td>
                                <td class="p-3 text-slate-600 dark:text-slate-400">{{ row.productCount }}</td>
                                <td class="p-3 text-slate-600 dark:text-slate-400">{{ row.quantitySold }}</td>
                                <td class="p-3 text-emerald-600 font-bold">{{ row.totalRevenue | number:'1.2-2' }}</td>
                                <td class="p-3 text-red-500 font-bold">{{ row.totalCost | number:'1.2-2' }}</td>
                                <td class="p-3 font-black" [class]="row.profit >= 0 ? 'text-green-600' : 'text-red-600'">{{ row.profit | number:'1.2-2' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }

                  <!-- Sales by Product -->
                  @if (sales()!.byProduct.length > 0) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">📦 المبيعات حسب الصنف</h4>
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <tr><th class="p-3 text-right font-bold">الصنف</th><th class="p-3 text-right font-bold">التصنيف</th><th class="p-3 text-right font-bold">الكمية</th><th class="p-3 text-right font-bold">الإيرادات</th><th class="p-3 text-right font-bold">الربح</th><th class="p-3 text-right font-bold">هامش الربح</th></tr>
                          </thead>
                          <tbody>
                            @for (row of sales()!.byProduct; track row.productId) {
                              <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td class="p-3"><span class="font-bold text-slate-700 dark:text-slate-300">{{ row.productName }}</span><br><span class="text-xs text-slate-400 font-mono" dir="ltr">{{ row.barcode }}</span></td>
                                <td class="p-3 text-slate-500">{{ row.categoryName }}</td>
                                <td class="p-3 text-slate-600 dark:text-slate-400 font-bold">{{ row.quantitySold }}</td>
                                <td class="p-3 text-emerald-600 font-bold">{{ row.totalRevenue | number:'1.2-2' }}</td>
                                <td class="p-3 font-black" [class]="row.profit >= 0 ? 'text-green-600' : 'text-red-600'">{{ row.profit | number:'1.2-2' }}</td>
                                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold" [class]="row.profitMargin >= 20 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : row.profitMargin >= 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'">{{ row.profitMargin }}%</span></td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-16 text-slate-400"><p class="text-lg">اختر فترة زمنية واضغط "عرض التقرير"</p></div>
              }
            }

            <!-- ═══════════ 3. STOCK MOVEMENT ═══════════ -->
            @if (activeTab() === 'stock') {
              @if (stockMovement()) {
                <div class="space-y-5">
                  <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div class="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                      <p class="text-xs font-bold text-blue-500">شراء (وارد)</p>
                      <p class="text-lg font-black text-blue-700 dark:text-blue-300">{{ stockMovement()!.totalPurchaseQty }}</p>
                    </div>
                    <div class="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <p class="text-xs font-bold text-emerald-500">بيع (صادر)</p>
                      <p class="text-lg font-black text-emerald-700 dark:text-emerald-300">{{ stockMovement()!.totalSaleQty }}</p>
                    </div>
                    <div class="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                      <p class="text-xs font-bold text-amber-500">مرتجعات</p>
                      <p class="text-lg font-black text-amber-700 dark:text-amber-300">{{ stockMovement()!.totalReturnQty }}</p>
                    </div>
                    <div class="bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-800 text-center">
                      <p class="text-xs font-bold text-red-500">تالف</p>
                      <p class="text-lg font-black text-red-700 dark:text-red-300">{{ stockMovement()!.totalDamageQty }}</p>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <p class="text-xs font-bold text-slate-500">تسوية</p>
                      <p class="text-lg font-black text-slate-700 dark:text-slate-300">{{ stockMovement()!.totalAdjustmentQty }}</p>
                    </div>
                  </div>

                  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">📋 سجل الحركات ({{ stockMovement()!.totalMovements }} حركة)</h4>
                    <div class="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table class="w-full text-sm">
                        <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0">
                          <tr><th class="p-3 text-right font-bold">الصنف</th><th class="p-3 text-right font-bold">النوع</th><th class="p-3 text-right font-bold">الكمية</th><th class="p-3 text-right font-bold">الرصيد الحالي</th><th class="p-3 text-right font-bold">التاريخ</th></tr>
                        </thead>
                        <tbody>
                          @for (row of stockMovement()!.movements; track $index) {
                            <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td class="p-3"><span class="font-bold text-slate-700 dark:text-slate-300">{{ row.productName }}</span><br><span class="text-xs text-slate-400 font-mono" dir="ltr">{{ row.barcode }}</span></td>
                              <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold" [class]="getMovementClass(row.movementType)">{{ getMovementLabel(row.movementType) }}</span></td>
                              <td class="p-3 font-bold text-slate-700 dark:text-slate-300">{{ row.quantity }}</td>
                              <td class="p-3 font-bold" [class]="row.currentStock <= 5 ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'">{{ row.currentStock }}</td>
                              <td class="p-3 text-slate-500"><span dir="ltr" class="font-mono text-xs">{{ row.movementDate | date:'yyyy-MM-dd HH:mm' }}</span></td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="text-center py-16 text-slate-400"><p class="text-lg">اختر فترة زمنية واضغط "عرض التقرير"</p></div>
              }
            }

            <!-- ═══════════ 4. EXPENSES ═══════════ -->
            @if (activeTab() === 'expenses') {
              @if (expenses()) {
                <div class="space-y-5">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-800">
                      <p class="text-xs font-bold text-red-600 dark:text-red-400">مصاريف تشغيلية</p>
                      <p class="text-xl font-black text-red-700 dark:text-red-300 mt-1">{{ expenses()!.totalExpenses | number:'1.2-2' }} <span class="text-xs">ج.م</span></p>
                    </div>
                    <div class="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p class="text-xs font-bold text-amber-600 dark:text-amber-400">سلف الموظفين</p>
                      <p class="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">{{ expenses()!.totalSalaryAdvances | number:'1.2-2' }} <span class="text-xs">ج.م</span></p>
                    </div>
                    <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                      <p class="text-xs font-bold text-slate-600 dark:text-slate-400">الإجمالي</p>
                      <p class="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">{{ expenses()!.grandTotal | number:'1.2-2' }} <span class="text-xs">ج.م</span></p>
                    </div>
                  </div>

                  @if (expenses()!.expenses.length > 0) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">💸 المصاريف التشغيلية</h4>
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <tr><th class="p-3 text-right font-bold">التاريخ</th><th class="p-3 text-right font-bold">المبلغ</th><th class="p-3 text-right font-bold">ملاحظات</th></tr>
                          </thead>
                          <tbody>
                            @for (row of expenses()!.expenses; track row.id) {
                              <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td class="p-3 text-slate-500"><span dir="ltr" class="font-mono text-xs">{{ row.date | date:'yyyy-MM-dd' }}</span></td>
                                <td class="p-3 text-red-600 font-bold">{{ row.amount | number:'1.2-2' }}</td>
                                <td class="p-3 text-slate-600 dark:text-slate-400">{{ row.notes || '—' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }

                  @if (expenses()!.salaryAdvances.length > 0) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">👤 سلف الموظفين</h4>
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <tr><th class="p-3 text-right font-bold">الموظف</th><th class="p-3 text-right font-bold">المبلغ</th><th class="p-3 text-right font-bold">التاريخ</th><th class="p-3 text-right font-bold">الحالة</th><th class="p-3 text-right font-bold">ملاحظات</th></tr>
                          </thead>
                          <tbody>
                            @for (row of expenses()!.salaryAdvances; track row.id) {
                              <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td class="p-3 font-bold text-slate-700 dark:text-slate-300">{{ row.employeeName }}</td>
                                <td class="p-3 text-amber-600 font-bold">{{ row.amount | number:'1.2-2' }}</td>
                                <td class="p-3 text-slate-500"><span dir="ltr" class="font-mono text-xs">{{ row.advanceDate | date:'yyyy-MM-dd' }}</span></td>
                                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold" [class]="row.status === 'Deducted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">{{ row.status === 'Deducted' ? 'تم الخصم' : 'معلقة' }}</span></td>
                                <td class="p-3 text-slate-600 dark:text-slate-400">{{ row.notes || '—' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-16 text-slate-400"><p class="text-lg">اختر فترة زمنية واضغط "عرض التقرير"</p></div>
              }
            }

            <!-- ═══════════ 5. BEST SELLING ═══════════ -->
            @if (activeTab() === 'best-selling') {
              @if (bestSelling()) {
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">🏆 أكثر الأصناف مبيعاً</h4>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                        <tr><th class="p-3 text-right font-bold w-12">#</th><th class="p-3 text-right font-bold">الصنف</th><th class="p-3 text-right font-bold">التصنيف</th><th class="p-3 text-right font-bold">الكمية المباعة</th><th class="p-3 text-right font-bold">الإيرادات</th><th class="p-3 text-right font-bold">الربح</th><th class="p-3 text-right font-bold">مرات الظهور</th></tr>
                      </thead>
                      <tbody>
                        @for (row of bestSelling()!.products; track row.productId) {
                          <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td class="p-3">
                              <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" [class]="row.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'">{{ row.rank }}</span>
                            </td>
                            <td class="p-3"><span class="font-bold text-slate-700 dark:text-slate-300">{{ row.productName }}</span><br><span class="text-xs text-slate-400 font-mono" dir="ltr">{{ row.barcode }}</span></td>
                            <td class="p-3 text-slate-500">{{ row.categoryName }}</td>
                            <td class="p-3 font-black text-violet-600">{{ row.quantitySold }}</td>
                            <td class="p-3 text-emerald-600 font-bold">{{ row.totalRevenue | number:'1.2-2' }}</td>
                            <td class="p-3 font-bold" [class]="row.profit >= 0 ? 'text-green-600' : 'text-red-600'">{{ row.profit | number:'1.2-2' }}</td>
                            <td class="p-3 text-slate-500 font-bold">{{ row.invoiceAppearances }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              } @else {
                <div class="text-center py-16 text-slate-400"><p class="text-lg">اختر فترة زمنية واضغط "عرض التقرير"</p></div>
              }
            }

            <!-- ═══════════ 6. INVENTORY ALERTS ═══════════ -->
            @if (activeTab() === 'alerts') {
              @if (inventoryAlerts()) {
                <div class="space-y-5">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-800 text-center">
                      <p class="text-xs font-bold text-red-600 dark:text-red-400">نفاد مخزون</p>
                      <p class="text-2xl font-black text-red-700 dark:text-red-300">{{ inventoryAlerts()!.outOfStockCount }}</p>
                    </div>
                    <div class="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                      <p class="text-xs font-bold text-amber-600 dark:text-amber-400">مخزون منخفض</p>
                      <p class="text-2xl font-black text-amber-700 dark:text-amber-300">{{ inventoryAlerts()!.lowStockCount }}</p>
                    </div>
                    <div class="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-xl border border-orange-200 dark:border-orange-800 text-center">
                      <p class="text-xs font-bold text-orange-600 dark:text-orange-400">منتهي الصلاحية</p>
                      <p class="text-2xl font-black text-orange-700 dark:text-orange-300">{{ inventoryAlerts()!.expiredCount }}</p>
                    </div>
                    <div class="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 text-center">
                      <p class="text-xs font-bold text-yellow-600 dark:text-yellow-400">قريب من الانتهاء</p>
                      <p class="text-2xl font-black text-yellow-700 dark:text-yellow-300">{{ inventoryAlerts()!.nearExpiryCount }}</p>
                    </div>
                  </div>

                  @if (inventoryAlerts()!.lowStockProducts.length > 0) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">📦 أصناف ناقصة أو نافدة</h4>
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <tr><th class="p-3 text-right font-bold">الصنف</th><th class="p-3 text-right font-bold">التصنيف</th><th class="p-3 text-right font-bold">الرصيد</th><th class="p-3 text-right font-bold">الحالة</th></tr>
                          </thead>
                          <tbody>
                            @for (row of inventoryAlerts()!.lowStockProducts; track row.productId) {
                              <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td class="p-3"><span class="font-bold text-slate-700 dark:text-slate-300">{{ row.productName }}</span><br><span class="text-xs text-slate-400 font-mono" dir="ltr">{{ row.barcode }}</span></td>
                                <td class="p-3 text-slate-500">{{ row.categoryName }}</td>
                                <td class="p-3 font-black" [class]="row.currentStock === 0 ? 'text-red-600' : 'text-amber-600'">{{ row.currentStock }}</td>
                                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold" [class]="row.stockStatus === 'OutOfStock' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : row.stockStatus === 'Critical' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'">{{ row.stockStatus === 'OutOfStock' ? 'نفاد كامل' : row.stockStatus === 'Critical' ? 'حرج' : 'منخفض' }}</span></td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }

                  @if (inventoryAlerts()!.nearExpiryBatches.length > 0) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200 p-4 border-b border-slate-200 dark:border-slate-700">⏰ أصناف قريبة من انتهاء الصلاحية</h4>
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <tr><th class="p-3 text-right font-bold">الصنف</th><th class="p-3 text-right font-bold">الكمية</th><th class="p-3 text-right font-bold">تاريخ الانتهاء</th><th class="p-3 text-right font-bold">المتبقي</th><th class="p-3 text-right font-bold">الحالة</th></tr>
                          </thead>
                          <tbody>
                            @for (row of inventoryAlerts()!.nearExpiryBatches; track row.batchId) {
                              <tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td class="p-3"><span class="font-bold text-slate-700 dark:text-slate-300">{{ row.productName }}</span><br><span class="text-xs text-slate-400 font-mono" dir="ltr">{{ row.barcode }}</span></td>
                                <td class="p-3 font-bold text-slate-600 dark:text-slate-400">{{ row.quantity }}</td>
                                <td class="p-3 text-slate-500"><span dir="ltr" class="font-mono text-xs">{{ row.expiryDate | date:'yyyy-MM-dd' }}</span></td>
                                <td class="p-3 font-bold" [class]="row.daysUntilExpiry < 0 ? 'text-red-600' : row.daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-amber-600'">{{ row.daysUntilExpiry < 0 ? 'منتهي' : row.daysUntilExpiry + ' يوم' }}</td>
                                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold" [class]="row.expiryStatus === 'Expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : row.expiryStatus === 'Critical' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'">{{ row.expiryStatus === 'Expired' ? 'منتهي' : row.expiryStatus === 'Critical' ? 'حرج' : 'تحذير' }}</span></td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }

                  @if (inventoryAlerts()!.lowStockProducts.length === 0 && inventoryAlerts()!.nearExpiryBatches.length === 0) {
                    <div class="text-center py-16">
                      <span class="text-5xl">✅</span>
                      <p class="text-lg font-bold text-green-600 mt-3">لا توجد تنبيهات حالياً</p>
                      <p class="text-slate-400 text-sm mt-1">جميع الأصناف في وضع مخزوني سليم</p>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-16">
                  <svg class="w-10 h-10 animate-spin text-violet-500 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  <p class="text-slate-400 text-sm mt-3">جارِ تحميل التنبيهات...</p>
                </div>
              }
            }

          }
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private notify = inject(NotificationService);

  activeTab = signal<ReportTab>('profit-loss');
  loading = signal(false);

  // Date range
  fromDate = '';
  toDate = '';
  granularity = 'daily';

  // Report data
  profitLoss = signal<ProfitLossReportDto | null>(null);
  sales = signal<SalesReportDto | null>(null);
  stockMovement = signal<StockMovementReportDto | null>(null);
  expenses = signal<ExpensesReportDto | null>(null);
  bestSelling = signal<BestSellingReportDto | null>(null);
  inventoryAlerts = signal<InventoryAlertsReportDto | null>(null);

  alertsBadge = computed(() => {
    const a = this.inventoryAlerts();
    return a ? a.outOfStockCount + a.expiredCount : 0;
  });

  tabs = [
    { key: 'profit-loss' as ReportTab, label: 'الأرباح والخسائر', icon: '📈' },
    { key: 'sales' as ReportTab, label: 'المبيعات', icon: '🛒' },
    { key: 'stock' as ReportTab, label: 'حركة المخزون', icon: '📦' },
    { key: 'expenses' as ReportTab, label: 'المصاريف والسلف', icon: '💸' },
    { key: 'best-selling' as ReportTab, label: 'الأكثر مبيعاً', icon: '🏆' },
    { key: 'alerts' as ReportTab, label: 'تنبيهات المخزون', icon: '⚠️' },
  ];

  ngOnInit() {
    this.setQuickDate('month');
    this.loadInventoryAlerts();
  }

  setActiveTab(tab: ReportTab) {
    this.activeTab.set(tab);
    if (tab === 'alerts' && !this.inventoryAlerts()) {
      this.loadInventoryAlerts();
    }
  }

  setQuickDate(period: string) {
    const today = new Date();
    this.toDate = today.toISOString().split('T')[0];
    if (period === 'today') {
      this.fromDate = this.toDate;
    } else if (period === 'week') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      this.fromDate = d.toISOString().split('T')[0];
    } else if (period === 'month') {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 1);
      this.fromDate = d.toISOString().split('T')[0];
    } else if (period === 'year') {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() - 1);
      this.fromDate = d.toISOString().split('T')[0];
    }
  }

  loadCurrentReport() {
    if (!this.fromDate || !this.toDate) {
      this.notify.error('يرجى تحديد الفترة الزمنية');
      return;
    }
    const tab = this.activeTab();
    this.loading.set(true);

    if (tab === 'profit-loss') {
      this.reportsService.getProfitLoss(this.fromDate, this.toDate, this.granularity).subscribe({
        next: (res) => { if (res.success) this.profitLoss.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    } else if (tab === 'sales') {
      this.reportsService.getSales(this.fromDate, this.toDate).subscribe({
        next: (res) => { if (res.success) this.sales.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    } else if (tab === 'stock') {
      this.reportsService.getStockMovements(this.fromDate, this.toDate).subscribe({
        next: (res) => { if (res.success) this.stockMovement.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    } else if (tab === 'expenses') {
      this.reportsService.getExpenses(this.fromDate, this.toDate).subscribe({
        next: (res) => { if (res.success) this.expenses.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    } else if (tab === 'best-selling') {
      this.reportsService.getBestSelling(this.fromDate, this.toDate).subscribe({
        next: (res) => { if (res.success) this.bestSelling.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    }
  }

  loadInventoryAlerts() {
    this.reportsService.getInventoryAlerts().subscribe({
      next: (res) => { if (res.success) this.inventoryAlerts.set(res.data); }
    });
  }

  getMovementLabel(type: string): string {
    const map: Record<string, string> = { Purchase: 'شراء', Sale: 'بيع', Return: 'مرتجع', Damage: 'تالف', Adjustment: 'تسوية' };
    return map[type] || type;
  }

  getMovementClass(type: string): string {
    const map: Record<string, string> = {
      Purchase: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      Sale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      Return: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      Damage: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      Adjustment: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    };
    return map[type] || 'bg-slate-100 text-slate-600';
  }

  exportCurrentReport() {
    const tab = this.activeTab();
    let data: any[] = [];
    let filename = 'report';

    if (tab === 'profit-loss' && this.profitLoss()) {
      filename = `profit_loss_${this.fromDate}_${this.toDate}`;
      const p = this.profitLoss()!;
      data = [
        { 'البند': 'إجمالي المبيعات', 'القيمة': p.totalSalesRevenue },
        { 'البند': 'المرتجعات', 'القيمة': p.totalReturnsAmount },
        { 'البند': 'صافي المبيعات', 'القيمة': p.netSalesRevenue },
        { 'البند': 'تكلفة البضاعة', 'القيمة': p.totalCostOfGoodsSold },
        { 'البند': 'إجمالي الربح', 'القيمة': p.grossProfit },
        { 'البند': 'المصاريف', 'القيمة': p.totalExpenses },
        { 'البند': 'السلف', 'القيمة': p.totalSalaryAdvances },
        { 'البند': 'صافي الربح', 'القيمة': p.netProfit },
      ];
    } else if (tab === 'sales' && this.sales()) {
      filename = `sales_${this.fromDate}_${this.toDate}`;
      data = this.sales()!.byProduct.map(r => ({
        'الصنف': r.productName, 'الباركود': r.barcode, 'التصنيف': r.categoryName,
        'الكمية': r.quantitySold, 'الإيرادات': r.totalRevenue, 'التكلفة': r.totalCost,
        'الربح': r.profit, 'هامش الربح %': r.profitMargin
      }));
    } else if (tab === 'stock' && this.stockMovement()) {
      filename = `stock_movements_${this.fromDate}_${this.toDate}`;
      data = this.stockMovement()!.movements.map(r => ({
        'الصنف': r.productName, 'الباركود': r.barcode, 'النوع': this.getMovementLabel(r.movementType),
        'الكمية': r.quantity, 'الرصيد الحالي': r.currentStock, 'التاريخ': r.movementDate
      }));
    } else if (tab === 'expenses' && this.expenses()) {
      filename = `expenses_${this.fromDate}_${this.toDate}`;
      data = [
        ...this.expenses()!.expenses.map(r => ({ 'النوع': 'مصاريف', 'البيان': r.notes || '—', 'المبلغ': r.amount, 'التاريخ': r.date })),
        ...this.expenses()!.salaryAdvances.map(r => ({ 'النوع': 'سلفة', 'البيان': r.employeeName, 'المبلغ': r.amount, 'التاريخ': r.advanceDate }))
      ];
    } else if (tab === 'best-selling' && this.bestSelling()) {
      filename = `best_selling_${this.fromDate}_${this.toDate}`;
      data = this.bestSelling()!.products.map(r => ({
        '#': r.rank, 'الصنف': r.productName, 'الباركود': r.barcode, 'التصنيف': r.categoryName,
        'الكمية المباعة': r.quantitySold, 'الإيرادات': r.totalRevenue, 'الربح': r.profit
      }));
    } else if (tab === 'alerts' && this.inventoryAlerts()) {
      filename = 'inventory_alerts';
      data = [
        ...this.inventoryAlerts()!.lowStockProducts.map(r => ({
          'النوع': 'مخزون', 'الصنف': r.productName, 'الباركود': r.barcode,
          'الرصيد': r.currentStock, 'الحالة': r.stockStatus
        })),
        ...this.inventoryAlerts()!.nearExpiryBatches.map(r => ({
          'النوع': 'صلاحية', 'الصنف': r.productName, 'الباركود': r.barcode,
          'الكمية': r.quantity, 'الانتهاء': r.expiryDate, 'المتبقي': r.daysUntilExpiry + ' يوم'
        }))
      ];
    }

    if (data.length === 0) {
      this.notify.error('لا توجد بيانات للتصدير — قم بعرض التقرير أولاً');
      return;
    }
    this.downloadCsv(data, filename);
    this.notify.success('تم تصدير التقرير بنجاح');
  }

  private downloadCsv(data: Record<string, any>[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const bom = '\uFEFF'; // UTF-8 BOM for Arabic support in Excel
    const csvContent = bom + headers.join(',') + '\n' +
      data.map(row => headers.map(h => {
        const val = row[h]?.toString() || '';
        return val.includes(',') || val.includes('\n') ? `"${val}"` : val;
      }).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

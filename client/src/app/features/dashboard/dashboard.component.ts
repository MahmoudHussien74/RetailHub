import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStatsDto } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-2xl font-black">مرحباً بك في RetailHub 👋</h2>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              بيانات حية مباشرة
            </span>
          </div>
          <p class="text-slate-300 text-sm mt-1">نظام إدارة نقاط البيع، المخزون، وحسابات الخزينة اليومية</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="loadStats()" class="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors" title="تحديث البيانات">
            <svg class="w-4 h-4" [class.animate-spin]="isLoading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
          <a routerLink="/pos" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 text-sm">
            <span>فتح شاشة الكاشير (POS)</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </a>
        </div>
      </div>

      <!-- Quick KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- 1. مبيعات اليوم -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">مبيعات اليوم</span>
            <span class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
          </div>
          <div class="mt-3">
            @if (isLoading()) {
              <div class="h-8 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
            } @else {
              <h3 class="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {{ stats()?.todaySales || 0 | number:'1.2-2' }} <span class="text-xs font-medium text-slate-500">ج.م</span>
              </h3>
            }
            <p class="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>
                {{ (stats()?.salesGrowthPercentage || 0) >= 0 ? '↑' : '↓' }}
                {{ stats()?.salesGrowthPercentage || 0 }}% مقارنة بالأمس
              </span>
            </p>
          </div>
        </div>

        <!-- 2. رصيد الخزينة الحالي -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">رصيد الخزينة الحالي</span>
            <span class="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </span>
          </div>
          <div class="mt-3">
            @if (isLoading()) {
              <div class="h-8 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
            } @else {
              <h3 class="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {{ stats()?.cashDrawerBalance || 0 | number:'1.2-2' }} <span class="text-xs font-medium text-slate-500">ج.م</span>
              </h3>
            }
            <p class="text-xs text-slate-400 mt-1">الرصيد الفعلي بالدرج اليوم</p>
          </div>
        </div>

        <!-- 3. الفواتير المكتملة -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">الفواتير المكتملة</span>
            <span class="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </span>
          </div>
          <div class="mt-3">
            @if (isLoading()) {
              <div class="h-8 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
            } @else {
              <h3 class="text-2xl font-black text-slate-800 dark:text-slate-100">
                {{ stats()?.todayInvoicesCount || 0 }} <span class="text-xs font-medium text-slate-500">فاتورة اليوم</span>
              </h3>
            }
            <p class="text-xs text-slate-400 mt-1">
              متوسط الفاتورة: {{ stats()?.averageInvoiceAmount || 0 | number:'1.2-2' }} ج.م
            </p>
          </div>
        </div>

        <!-- 4. تنبيهات النواقص والصلاحية -->
        <a routerLink="/products" [queryParams]="{ filter: 'lowStock' }"
          class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer block group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-rose-600 transition-colors">تنبيهات المخزن والصلاحية</span>
            <span class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </span>
          </div>
          <div class="mt-3">
            @if (isLoading()) {
              <div class="h-8 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
            } @else {
              <h3 class="text-2xl font-black text-rose-600 dark:text-rose-400">
                {{ (stats()?.lowStockProductsCount || 0) + (stats()?.outOfStockProductsCount || 0) }}
                <span class="text-xs font-medium text-slate-500">صنف بحاجة لطلب</span>
              </h3>
            }
            <p class="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1.5">
              <span>{{ stats()?.outOfStockProductsCount || 0 }} نفدت</span>
              <span>•</span>
              <span>{{ stats()?.lowStockProductsCount || 0 }} مخزون حرج</span>
            </p>
          </div>
        </a>
      </div>

      <!-- Inventory & Recent Activity Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left 2 Cols: Recent Invoices -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-800 dark:text-slate-100">أحدث فواتير المبيعات</h3>
              <p class="text-xs text-slate-400 mt-0.5">آخر العمليات التي تم تسجيلها في النظام</p>
            </div>
            <a routerLink="/sales" class="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              عرض كل الفواتير ←
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-right text-xs">
              <thead class="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold">
                <tr>
                  <th class="pb-2.5">رقم الفاتورة</th>
                  <th class="pb-2.5">العميل</th>
                  <th class="pb-2.5">الوقت</th>
                  <th class="pb-2.5">الإجمالي</th>
                  <th class="pb-2.5 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
                @for (inv of stats()?.recentInvoices || []; track inv.id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{{ inv.invoiceNumber }}</td>
                    <td class="py-3 text-slate-700 dark:text-slate-300">{{ inv.customerName }}</td>
                    <td class="py-3 text-slate-400 font-mono">{{ inv.createdAt | date:'shortTime' }}</td>
                    <td class="py-3 font-black text-emerald-600 font-mono">{{ inv.totalAmount | number:'1.2-2' }} ج.م</td>
                    <td class="py-3 text-center">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        مكتملة ✓
                      </span>
                    </td>
                  </tr>
                }
                @if ((stats()?.recentInvoices || []).length === 0) {
                  <tr>
                    <td colspan="5" class="py-8 text-center text-slate-400">لا توجد فواتير مسجلة اليوم حتى الآن</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right 1 Col: Quick Inventory Shortcuts & Health -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div>
            <h3 class="font-bold text-base text-slate-800 dark:text-slate-100">صحة المخزن والأصناف</h3>
            <p class="text-xs text-slate-400 mt-0.5">نظرة عامة على مستودع الصيدلية</p>
          </div>

          <div class="space-y-3">
            <a routerLink="/products"
              class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all cursor-pointer group">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">📦</span>
                <div>
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-200 block group-hover:text-emerald-700">إجمالي الأصناف الفعالة</span>
                  <span class="text-[10px] text-slate-400">المسجلة في قاعدة البيانات</span>
                </div>
              </div>
              <span class="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">{{ stats()?.totalProductsCount || 0 }}</span>
            </a>

            <a routerLink="/products" [queryParams]="{ filter: 'lowStock' }"
              class="p-3 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 border border-amber-200/50 hover:border-amber-300 rounded-xl flex items-center justify-between transition-all cursor-pointer group">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">⚠️</span>
                <div>
                  <span class="text-xs font-bold text-amber-900 dark:text-amber-200 block group-hover:underline">نواقص / مخزون حرج</span>
                  <span class="text-[10px] text-amber-700 dark:text-amber-400">أقل من 5 وحدات (اضغط للعرض)</span>
                </div>
              </div>
              <span class="text-sm font-black text-amber-800 dark:text-amber-300 font-mono">{{ stats()?.lowStockProductsCount || 0 }}</span>
            </a>

            <a routerLink="/products" [queryParams]="{ filter: 'outOfStock' }"
              class="p-3 rounded-xl bg-rose-50/60 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200/50 hover:border-rose-300 rounded-xl flex items-center justify-between transition-all cursor-pointer group">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">🛑</span>
                <div>
                  <span class="text-xs font-bold text-rose-900 dark:text-rose-200 block group-hover:underline">أصناف نفدت بالكامل</span>
                  <span class="text-[10px] text-rose-700 dark:text-rose-400">الرصيد بالمخزن 0 (اضغط للعرض)</span>
                </div>
              </div>
              <span class="text-sm font-black text-rose-800 dark:text-rose-300 font-mono">{{ stats()?.outOfStockProductsCount || 0 }}</span>
            </a>

            <div class="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 rounded-xl flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-xs">⏳</span>
                <div>
                  <span class="text-xs font-bold text-purple-900 dark:text-purple-200 block">قرب انتهاء الصلاحية</span>
                  <span class="text-[10px] text-purple-700 dark:text-purple-400">خلال الـ 60 يوماً القادمة</span>
                </div>
              </div>
              <span class="text-sm font-black text-purple-800 dark:text-purple-300 font-mono">{{ stats()?.nearExpiryBatchesCount || 0 }}</span>
            </div>
          </div>

          <a routerLink="/products" [queryParams]="{ filter: 'lowStock' }"
            class="w-full py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs">
            <span>عرض النواقص والمخزون الحرج</span>
            <span>←</span>
          </a>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStatsDto | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.dashboardService.getStats().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}

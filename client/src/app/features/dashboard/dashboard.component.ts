import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h2 class="text-2xl font-black">مرحباً بك في RetailHub 👋</h2>
          <p class="text-slate-300 text-sm mt-1">نظام إدارة نقاط البيع، المخزون، وحسابات الخزينة اليومية</p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/pos" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 text-sm">
            <span>فتح شاشة الكاشير (POS)</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </a>
        </div>
      </div>

      <!-- Quick KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">مبيعات اليوم</span>
            <span class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
          </div>
          <div class="mt-3">
            <h3 class="text-2xl font-black text-slate-800">4,850.00 <span class="text-xs font-medium text-slate-500">ج.م</span></h3>
            <p class="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↑ 12% مقارنة بالأمس</span>
            </p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">رصيد الخزينة الحالي</span>
            <span class="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </span>
          </div>
          <div class="mt-3">
            <h3 class="text-2xl font-black text-slate-800">3,200.00 <span class="text-xs font-medium text-slate-500">ج.م</span></h3>
            <p class="text-xs text-slate-400 mt-1">مطابق مع السجل الموحد</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">الفواتير المكتملة</span>
            <span class="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </span>
          </div>
          <div class="mt-3">
            <h3 class="text-2xl font-black text-slate-800">34 <span class="text-xs font-medium text-slate-500">فاتورة</span></h3>
            <p class="text-xs text-slate-400 mt-1">متوسط الفاتورة: 142 ج.م</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">تنبيهات الصلاحية والمخزن</span>
            <span class="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </span>
          </div>
          <div class="mt-3">
            <h3 class="text-2xl font-black text-rose-600">3 <span class="text-xs font-medium text-slate-500">أصناف</span></h3>
            <p class="text-xs text-rose-500 mt-1 font-semibold">تشغيلات قاربت على الانتهاء</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {}

import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashDrawerService } from '../../core/services/cash-drawer.service';
import { ShiftsService } from '../../core/services/shifts.service';
import { NotificationService } from '../../core/services/notification.service';
import { PrintService } from '../../core/services/print.service';
import { CashDrawerTransactionDto, DailySummaryDto, RecordCashDrawerTransactionDto } from '../../core/models/operational.model';
import { ShiftDto } from '../../core/models/shift.model';

@Component({
  selector: 'app-cash-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800">الخزينة والوردية اليومية</h2>
          <p class="text-sm text-slate-500 mt-1">متابعة السيولة النقدية، حركات المبيعات، والمصروفات اليومية</p>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <button (click)="openCloseShiftModal()"
            class="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 text-sm transition-all flex items-center gap-2 border border-slate-700">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            🔒 تقفيل الوردية (جرد الدرج)
          </button>

          <button (click)="openTransactionModal()"
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            تسجيل حركة نقدية (مصروف/إيداع)
          </button>
        </div>
      </div>

      <!-- Date Filter Bar -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <span class="text-xs font-bold text-slate-500">تاريخ الوردية:</span>
          <input [(ngModel)]="selectedDate" (change)="onDateChange()" type="date"
            class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500">
          <button (click)="setToday()"
            class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">
            اليوم
          </button>
        </div>
        <button (click)="loadData()"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-end sm:self-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          تحديث البيانات
        </button>
      </div>

      <!-- Closed Shift Status Banner -->
      @if (currentShift() && !currentShift()?.isOpen) {
        <div class="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
             [ngClass]="currentShift()?.status === 'Shortage' ? 'bg-rose-50 border-rose-200 text-rose-800' : (currentShift()?.status === 'Surplus' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800')">
          <div class="flex items-center gap-3">
            <span class="text-3xl">{{ currentShift()?.status === 'Shortage' ? '⚠️' : (currentShift()?.status === 'Surplus' ? 'ℹ️' : '✅') }}</span>
            <div>
              <div class="text-sm font-black flex items-center gap-2">
                <span>آخر وردية تم إغلاقها: {{ currentShift()?.statusText }}</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold"
                      [ngClass]="currentShift()?.status === 'Shortage' ? 'bg-rose-200 text-rose-900' : (currentShift()?.status === 'Surplus' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900')">
                  {{ currentShift()?.status === 'Shortage' ? 'عجز مسجل' : (currentShift()?.status === 'Surplus' ? 'زيادة مسجلة' : 'مطابقة تامة') }}
                </span>
              </div>
              <div class="text-xs font-semibold opacity-90 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>المتوقع: <strong class="font-mono">{{ currentShift()?.expectedCash | number:'1.2-2' }}</strong> ج.م</span>
                <span>الفعلي المحصي: <strong class="font-mono">{{ currentShift()?.actualCash | number:'1.2-2' }}</strong> ج.م</span>
                <span>الفارق: <strong class="font-mono" dir="ltr">{{ (currentShift()?.difference ?? 0) < 0 ? '−' : ((currentShift()?.difference ?? 0) > 0 ? '+' : '') }}{{ getAbs(currentShift()?.difference) | number:'1.2-2' }}</strong> ج.م</span>
                <span>الكاشير: {{ currentShift()?.cashierName }}</span>
              </div>
            </div>
          </div>
          <button (click)="printZReport()"
            class="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 self-end sm:self-auto">
            <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            طباعة الـ Z-Report
          </button>
        </div>
      }

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400">الرصيد الافتتاحي</span>
            <div class="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-black font-mono text-slate-800">{{ summary()?.openingBalance || 0 | number:'1.2-2' }}</span>
            <span class="text-xs font-bold text-slate-400 mr-1.5">ج.م</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-600">إجمالي المقبوضات (داخل)</span>
            <div class="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-black font-mono text-emerald-600">+{{ summary()?.totalInflows || 0 | number:'1.2-2' }}</span>
            <span class="text-xs font-bold text-emerald-600 mr-1.5">ج.م</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm bg-gradient-to-br from-white to-rose-50/30">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-rose-600">إجمالي المدفوعات (خارج)</span>
            <div class="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"></path>
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-black font-mono text-rose-600">-{{ getAbs(summary()?.totalOutflows) | number:'1.2-2' }}</span>
            <span class="text-xs font-bold text-rose-600 mr-1.5">ج.م</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-300">الرصيد الختامي المتوقع</span>
            <div class="p-2 bg-white/10 text-white rounded-xl">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-2xl font-black font-mono" [class]="(summary()?.closingBalance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'">
              {{ summary()?.closingBalance || 0 | number:'1.2-2' }}
            </span>
            <span class="text-xs font-bold text-slate-300 mr-1.5">ج.م</span>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-sm">حركات الخزينة لليوم</h3>
          <span class="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
            {{ summary()?.transactionCount || transactions().length }} حركة
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-right text-sm">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
              <tr>
                <th class="px-5 py-4">الوقت</th>
                <th class="px-5 py-4">نوع الحركة</th>
                <th class="px-5 py-4">المبلغ</th>
                <th class="px-5 py-4">المرجع</th>
                <th class="px-5 py-4">ملاحظات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (t of transactions(); track t.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-4 text-slate-500 text-xs font-mono" dir="ltr">
                    {{ t.transactionDate | date:'HH:mm:ss' }}
                  </td>
                  <td class="px-5 py-4">
                    <span [class]="getTypeClass(t.type)" class="px-2.5 py-1 rounded-full text-xs font-bold">
                      {{ getTypeLabel(t.type) }}
                    </span>
                  </td>
                  <td class="px-5 py-4 font-bold font-mono">
                    <span [class]="t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                      {{ t.amount >= 0 ? '+' : '' }}{{ t.amount | number:'1.2-2' }} ج.م
                    </span>
                  </td>
                  <td class="px-5 py-4 text-slate-500 text-xs font-mono">{{ t.referenceId || '—' }}</td>
                  <td class="px-5 py-4 text-slate-600 text-xs">{{ t.notes || '—' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-5 py-12 text-center text-slate-400">
                    <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    لا توجد حركات مسجلة لهذا التاريخ
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Close Shift Modal (جرد الدرج وتقفيل الوردية) -->
      @if (showCloseShiftModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Modal Header -->
            <div class="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="p-2 rounded-xl bg-amber-400/20 text-amber-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-white">إغلاق الوردية وجرد النقدية</h3>
                  <p class="text-xs text-slate-300">مقارنة النقدية الفعلية بالرصيد الدفتري وطباعة تقرير الـ Z</p>
                </div>
              </div>
              <button (click)="showCloseShiftModal.set(false)" class="text-slate-400 hover:text-white p-1 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <!-- Modal Content -->
            <div class="p-6 overflow-y-auto space-y-5">
              <!-- Summary Grid -->
              <div class="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span class="text-xs font-bold text-slate-500 block mb-0.5">الرصيد الدفتري المتوقع بالدرج</span>
                  <span class="text-xl font-black font-mono text-slate-900">{{ expectedBalance() | number:'1.2-2' }} ج.م</span>
                </div>
                <div>
                  <span class="text-xs font-bold text-slate-500 block mb-0.5">إجمالي حركات اليوم</span>
                  <span class="text-xl font-black font-mono text-emerald-600">{{ summary()?.transactionCount || 0 }} حركة</span>
                </div>
              </div>

              <!-- Actual Cash Count Input -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">النقدية الفعلية المحصية في الدرج (ج.م) *</label>
                <div class="relative">
                  <input [(ngModel)]="actualCashCount" (input)="onActualCashChange()" type="number" step="0.5" min="0"
                    placeholder="0.00"
                    class="w-full bg-amber-50/50 border-2 border-amber-300 focus:border-amber-500 rounded-2xl px-5 py-3 text-2xl font-black font-mono text-slate-900 focus:outline-none focus:bg-white transition-all pl-16">
                  <span class="absolute left-4 top-4 text-xs font-bold text-amber-700">ج.م كاش</span>
                </div>
              </div>

              <!-- Quick Denomination Calculator Accordion -->
              <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
                <div class="flex items-center justify-between cursor-pointer" (click)="toggleDenomCalc()">
                  <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    حاسبة فئات النقدية السريعة (200، 100، 50...)
                  </span>
                  <span class="text-xs font-bold text-emerald-600">{{ showDenomCalc() ? 'إخفاء ▲' : 'إظهار ▼' }}</span>
                </div>

                @if (showDenomCalc()) {
                  <div class="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-200">
                    <div>
                      <label class="text-[10px] font-bold text-slate-500 block">فئة 200 ج.م</label>
                      <input [(ngModel)]="denoms.d200" (input)="calcFromDenoms()" type="number" min="0" placeholder="0" class="w-full p-2 border rounded-xl text-xs font-mono text-center">
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-500 block">فئة 100 ج.م</label>
                      <input [(ngModel)]="denoms.d100" (input)="calcFromDenoms()" type="number" min="0" placeholder="0" class="w-full p-2 border rounded-xl text-xs font-mono text-center">
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-500 block">فئة 50 ج.م</label>
                      <input [(ngModel)]="denoms.d50" (input)="calcFromDenoms()" type="number" min="0" placeholder="0" class="w-full p-2 border rounded-xl text-xs font-mono text-center">
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-500 block">فئة 20 ج.م</label>
                      <input [(ngModel)]="denoms.d20" (input)="calcFromDenoms()" type="number" min="0" placeholder="0" class="w-full p-2 border rounded-xl text-xs font-mono text-center">
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-500 block">فئة 10 ج.م</label>
                      <input [(ngModel)]="denoms.d10" (input)="calcFromDenoms()" type="number" min="0" placeholder="0" class="w-full p-2 border rounded-xl text-xs font-mono text-center">
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-500 block">فكة / 5 ج.م</label>
                      <input [(ngModel)]="denoms.d5" (input)="calcFromDenoms()" type="number" min="0" placeholder="0" class="w-full p-2 border rounded-xl text-xs font-mono text-center">
                    </div>
                  </div>
                }
              </div>

              <!-- Shift Result Comparison Status -->
              <div [class]="statusCardClass()" class="p-4 rounded-2xl border transition-all">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold">{{ statusTitle() }}</span>
                  <span class="text-base font-black font-mono" dir="ltr">{{ differenceText() }}</span>
                </div>
                <p class="text-[11px] mt-1 opacity-90">{{ statusDescription() }}</p>
              </div>

              <!-- Notes / Next Shift Handover -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">ملاحظات تسليم الوردية / اسم المستلم</label>
                <input [(ngModel)]="shiftNotes" type="text"
                  placeholder="مثال: تم تسليم النقدية للصيدلي المناوب د. أحمد صلاح"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-slate-800">
              </div>
            </div>

            <!-- Modal Footer Buttons -->
            <div class="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button (click)="printZReport()"
                class="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                معاينة وطباعة الـ Z-Report
              </button>

              <div class="flex items-center gap-2">
                <button (click)="showCloseShiftModal.set(false)"
                  class="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200/60 rounded-xl">إلغاء</button>
                <button (click)="confirmCloseShift()"
                  class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  تأكيد الإغلاق وحفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Record Transaction Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 class="text-base font-bold text-slate-800">تسجيل حركة نقدية بالخزينة</h3>
              <button (click)="showModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">نوع الحركة *</label>
                <select [(ngModel)]="newTx.type"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white">
                  <option value="Expense">مصروفات عامة / نثرية (خارج)</option>
                  <option value="Sale">إيداع مبيعات إضافي (داخل)</option>
                  <option value="Return">مرتجع مدفوع نقداً (خارج)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">المبلغ (ج.م) *</label>
                <input [(ngModel)]="newTx.amount" type="number" min="1"
                  placeholder="0.00"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-bold font-mono text-emerald-600 focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">بيان / سبب الحركة *</label>
                <input [(ngModel)]="newTx.notes" type="text"
                  placeholder="مثال: فاتورة كهرباء / بوفيه / صيانة"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button (click)="showModal.set(false)"
                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl">إلغاء</button>
              <button (click)="saveTransaction()" [disabled]="!newTx.amount || newTx.amount <= 0 || !newTx.notes"
                class="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-md shadow-emerald-600/20">تأكيد وتسجيل</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CashDrawerComponent implements OnInit {
  private cashDrawerService = inject(CashDrawerService);
  private shiftsService = inject(ShiftsService);
  private notification = inject(NotificationService);
  private printService = inject(PrintService);

  selectedDate = new Date().toISOString().split('T')[0];
  summary = signal<DailySummaryDto | null>(null);
  transactions = signal<CashDrawerTransactionDto[]>([]);
  currentShift = signal<ShiftDto | null>(null);

  // Manual Transaction Modal
  showModal = signal(false);
  newTx: RecordCashDrawerTransactionDto = {
    type: 'Expense',
    amount: 0,
    notes: ''
  };

  // Close Shift / End Day Modal
  showCloseShiftModal = signal(false);
  actualCashCount: number | null = null;
  shiftNotes = '';
  showDenomCalc = signal(false);
  denoms = { d200: 0, d100: 0, d50: 0, d20: 0, d10: 0, d5: 0 };

  expectedBalance = computed(() => this.summary()?.closingBalance || 0);

  difference = computed(() => {
    if (this.actualCashCount === null) return 0;
    return Number((this.actualCashCount - this.expectedBalance()).toFixed(2));
  });

  statusTitle = computed(() => {
    if (this.actualCashCount === null) return 'يرجى إدخال المبلغ الفعلي المحصي';
    const diff = this.difference();
    if (diff === 0) return 'مطابقة تامة ✅';
    if (diff < 0) return 'يوجد عجز في الدرج ⚠️';
    return 'توجد زيادة في الدرج ℹ️';
  });

  differenceText = computed(() => {
    if (this.actualCashCount === null) return '0.00 ج.م';
    const diff = this.difference();
    if (diff < 0) return `−${Math.abs(diff).toFixed(2)} ج.م عجز`;
    if (diff > 0) return `+${diff.toFixed(2)} ج.م زيادة`;
    return '0.00 ج.م مطابق';
  });

  statusDescription = computed(() => {
    if (this.actualCashCount === null) return 'قم بعد النقدية الفعلية داخل الدرج وأدخل الإجمالي في الحقل أعلاه.';
    const diff = this.difference();
    if (diff === 0) return 'المبلغ الفعلي المحصي في الدرج يطابق الرصيد الدفتري للنظام بالكامل.';
    if (diff < 0) return `المبلغ الفعلي أقل من المتوقع بمقدار ${Math.abs(diff).toFixed(2)} ج.م (عجز في العهدة سيتم تسجيله).`;
    return `المبلغ الفعلي أكبر من المتوقع بمقدار ${diff.toFixed(2)} ج.م (زيادة غير مسجلة).`;
  });

  statusCardClass = computed(() => {
    if (this.actualCashCount === null) return 'bg-slate-50 text-slate-700 border-slate-200';
    const diff = this.difference();
    if (diff === 0) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (diff < 0) return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  });

  ngOnInit() {
    this.loadData();
    this.loadCurrentShift();
  }

  setToday() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadData();
    this.loadCurrentShift();
  }

  onDateChange() {
    this.loadData();
  }

  loadCurrentShift() {
    this.shiftsService.getCurrentShift().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentShift.set(res.data);
        }
      }
    });
  }

  loadData() {
    this.cashDrawerService.getDailySummary(this.selectedDate).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.summary.set(res.data);
        }
      }
    });

    this.cashDrawerService.getTransactions(this.selectedDate).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.transactions.set(res.data.items);
        }
      },
      error: () => this.notification.error('فشل تحميل حركات الخزينة')
    });
  }

  openCloseShiftModal() {
    this.actualCashCount = null;
    this.shiftNotes = '';
    this.denoms = { d200: 0, d100: 0, d50: 0, d20: 0, d10: 0, d5: 0 };
    this.showCloseShiftModal.set(true);
  }

  toggleDenomCalc() {
    this.showDenomCalc.update(v => !v);
  }

  calcFromDenoms() {
    const total = (this.denoms.d200 * 200) +
                  (this.denoms.d100 * 100) +
                  (this.denoms.d50 * 50) +
                  (this.denoms.d20 * 20) +
                  (this.denoms.d10 * 10) +
                  (this.denoms.d5 * 5);
    this.actualCashCount = total;
  }

  onActualCashChange() {
    // manual change
  }

  printZReport() {
    const shift = this.currentShift();
    if (shift && !shift.isOpen) {
      this.printService.printShiftClosingReport({
        cashierName: shift.cashierName,
        shiftDate: this.selectedDate,
        openingBalance: shift.openingBalance,
        totalInflows: shift.totalCashIn,
        totalOutflows: shift.totalCashOut,
        expectedBalance: shift.expectedCash,
        actualBalance: shift.actualCash ?? 0,
        difference: shift.difference ?? 0,
        totalDiscounts: shift.totalDiscounts,
        transactionCount: shift.transactionCount,
        notes: shift.notes || undefined
      });
      return;
    }

    const s = this.summary();
    const actual = this.actualCashCount ?? this.expectedBalance();
    const diff = Number((actual - this.expectedBalance()).toFixed(2));
    this.printService.printShiftClosingReport({
      cashierName: 'أحمد محمود (صيدلي وردية)',
      shiftDate: this.selectedDate,
      openingBalance: s?.openingBalance || 0,
      totalInflows: s?.totalInflows || 0,
      totalOutflows: s?.totalOutflows || 0,
      expectedBalance: this.expectedBalance(),
      actualBalance: actual,
      difference: diff,
      totalDiscounts: s?.totalDiscounts || 0,
      transactionCount: s?.transactionCount || 0,
      notes: this.shiftNotes || undefined
    });
  }

  confirmCloseShift() {
    if (this.actualCashCount === null || isNaN(this.actualCashCount)) {
      this.notification.error('يرجى إدخال المبلغ الفعلي المحصي في الدرج أولاً');
      return;
    }

    this.shiftsService.closeShift({
      actualCash: this.actualCashCount,
      notes: this.shiftNotes || undefined,
      cashierName: 'صيدلي الوردية'
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const shift = res.data;
          this.currentShift.set(shift);
          this.printService.printShiftClosingReport({
            cashierName: shift.cashierName,
            shiftDate: this.selectedDate,
            openingBalance: shift.openingBalance,
            totalInflows: shift.totalCashIn,
            totalOutflows: shift.totalCashOut,
            expectedBalance: shift.expectedCash,
            actualBalance: shift.actualCash ?? 0,
            difference: shift.difference ?? 0,
            totalDiscounts: shift.totalDiscounts,
            transactionCount: shift.transactionCount,
            notes: shift.notes || undefined
          });

          this.notification.success(`تم تقفيل الوردية وحفظ التقرير: ${shift.statusText}`);
          this.showCloseShiftModal.set(false);
          this.loadData();
          this.loadCurrentShift();
        } else {
          this.notification.error(res.message || 'فشل إغلاق الوردية');
        }
      },
      error: () => this.notification.error('حدث خطأ أثناء إغلاق الوردية في السيرفر')
    });
  }

  openTransactionModal() {
    this.newTx = { type: 'Expense', amount: 0, notes: '' };
    this.showModal.set(true);
  }

  saveTransaction() {
    if (!this.newTx.amount || this.newTx.amount <= 0 || !this.newTx.notes) return;

    // Outflows (Expense / Return) must be negative numbers in the ledger
    const signedAmount = (this.newTx.type === 'Expense' || this.newTx.type === 'Return')
      ? -Math.abs(this.newTx.amount)
      : Math.abs(this.newTx.amount);

    const txToSend: RecordCashDrawerTransactionDto = {
      ...this.newTx,
      amount: signedAmount
    };

    this.cashDrawerService.recordTransaction(txToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('تم تسجيل الحركة النقدية بنجاح');
          this.showModal.set(false);
          this.loadData();
        } else {
          this.notification.error(res.message || 'فشل التسجيل');
        }
      },
      error: () => this.notification.error('حدث خطأ أثناء تسجيل الحركة')
    });
  }

  getAbs(n: number | undefined | null): number {
    return Math.abs(n || 0);
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'Sale': return 'مبيعات نقدية';
      case 'Return': return 'مرتجع نقدي';
      case 'SalaryAdvance': return 'سلفة راتب';
      case 'Expense': return 'مصروفات / شراء';
      default: return type;
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'Sale': return 'bg-emerald-100 text-emerald-700';
      case 'Return': return 'bg-amber-100 text-amber-700';
      case 'SalaryAdvance': return 'bg-purple-100 text-purple-700';
      case 'Expense': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
}

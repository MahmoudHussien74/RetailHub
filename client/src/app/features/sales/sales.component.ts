import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoicesService } from '../../core/services/invoices.service';
import { ReturnInvoicesService } from '../../core/services/returns-payments.service';
import { NotificationService } from '../../core/services/notification.service';
import { InvoiceListDto, InvoiceDetailDto } from '../../core/models/invoice.model';
import { CreateReturnRequest, ReturnItemRequest } from '../../core/models/operational.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800">فواتير المبيعات</h2>
          <p class="text-sm text-slate-500 mt-1">سجل جميع فواتير البيع والمرتجعات</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div class="flex flex-col sm:flex-row gap-4">
          <select [(ngModel)]="filterStatus" (ngModelChange)="loadInvoices()"
            class="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
            <option value="">كل الحالات</option>
            <option value="Paid">مدفوعة بالكامل</option>
            <option value="Partial">مدفوعة جزئياً</option>
            <option value="Credit">آجل</option>
          </select>
          <input type="date" [(ngModel)]="filterFrom" (ngModelChange)="loadInvoices()"
            class="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
          <input type="date" [(ngModel)]="filterTo" (ngModelChange)="loadInvoices()"
            class="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">رقم الفاتورة</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">التاريخ</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">عدد الأصناف</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">المجموع</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الخصم</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الإجمالي</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">المدفوع</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (inv of invoices(); track inv.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors"
                    [class.opacity-50]="inv.isVoided"
                    [class.bg-purple-50/30]="inv.isFullyReturned"
                    [class.bg-amber-50/20]="inv.hasReturns && !inv.isFullyReturned">
                    <td class="px-5 py-3.5">
                      <span class="text-sm font-bold text-slate-800">{{ inv.invoiceNumber }}</span>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-slate-500">{{ inv.createdAt | date:'yyyy/MM/dd - hh:mm a' }}</td>
                    <td class="px-5 py-3.5 text-sm text-slate-600 font-semibold">{{ inv.itemCount }} صنف</td>
                    <td class="px-5 py-3.5 text-sm text-slate-600 font-medium">{{ (inv.subtotal || inv.totalAmount) | number:'1.2-2' }} ج.م</td>
                    <td class="px-5 py-3.5 text-sm font-semibold whitespace-nowrap">
                      @if (inv.discountAmount > 0) {
                        <span class="inline-flex items-center gap-1 text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-300" dir="ltr">
                          <span>-{{ inv.discountAmount | number:'1.2-2' }} ج.م</span>
                          <span class="text-[10px] text-amber-700 font-semibold">({{ inv.discountPercent }}%)</span>
                        </span>
                      } @else {
                        <span class="text-slate-400 text-xs">—</span>
                      }
                    </td>
                    <td class="px-5 py-3.5 text-sm font-bold text-slate-800">
                      <div>{{ inv.totalAmount | number:'1.2-2' }} ج.م</div>
                      @if (inv.totalRefunded && inv.totalRefunded > 0) {
                        <span class="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold border border-purple-200 inline-block mt-0.5" title="المبلغ المسترد كمرتجع">
                          مسترد: {{ inv.totalRefunded | number:'1.2-2' }} ج.م
                        </span>
                      }
                    </td>
                    <td class="px-5 py-3.5 text-sm font-semibold text-emerald-700">{{ inv.amountPaid | number:'1.2-2' }} ج.م</td>
                    <td class="px-5 py-3.5">
                      @if (inv.isVoided) {
                        <span class="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">ملغاة</span>
                      } @else if (inv.isFullyReturned) {
                        <span class="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-300 flex items-center gap-1 w-max">
                          <span class="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                          مرتجع كامل
                        </span>
                      } @else if (inv.hasReturns) {
                        <span class="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1 w-max">
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          مرتجع جزئي
                        </span>
                      } @else {
                        <span [class]="{
                          'text-emerald-700 bg-emerald-50 border-emerald-200': inv.paymentStatus === 'Paid',
                          'text-amber-700 bg-amber-50 border-amber-200': inv.paymentStatus === 'Partial',
                          'text-rose-700 bg-rose-50 border-rose-200': inv.paymentStatus === 'Credit'
                        }" class="text-xs font-bold px-2.5 py-1 rounded-full border">
                          {{ inv.paymentStatus === 'Paid' ? 'مدفوعة' : inv.paymentStatus === 'Partial' ? 'جزئي' : 'آجل' }}
                        </span>
                      }
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2">
                        <button (click)="viewInvoiceDetails(inv)"
                          class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="عرض التفاصيل">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                        @if (!inv.isVoided && !inv.isFullyReturned) {
                          <button (click)="openReturnModal(inv)"
                            class="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="عمل مرتجع (استرجاع أصناف أو فاتورة)">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4M3 10l4-4m-4 4l4 4"></path></svg>
                          </button>
                        }
                        @if (!inv.isVoided && !inv.hasReturns) {
                          <button (click)="confirmVoidInvoice(inv)"
                            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="إلغاء الفاتورة">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @if (invoices().length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-16 text-slate-400 text-sm">
                      <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      لا توجد فواتير مبيعات بعد
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <span class="text-xs text-slate-500">عرض {{ invoices().length }} من {{ totalCount() }} فاتورة</span>
              <div class="flex gap-1">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1"
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">السابق</button>
                <span class="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg">{{ currentPage() }} / {{ totalPages() }}</span>
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">التالي</button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Invoice Detail Modal -->
      @if (selectedInvoice()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="selectedInvoice.set(null)">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col overflow-hidden animate-scale-in" (click)="$event.stopPropagation()">
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 class="text-lg font-bold text-white">تفاصيل الفاتورة</h3>
                <p class="text-sm text-slate-300 mt-0.5">{{ selectedInvoice()!.invoiceNumber }}</p>
              </div>
              <button (click)="selectedInvoice.set(null)" class="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700/50 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div class="p-6 space-y-5 overflow-y-auto flex-1">
              <!-- Return Status Banner if present -->
              @if (selectedInvoice()!.hasReturns) {
                <div class="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
                  <div class="flex items-center gap-2 font-bold">
                    <span class="w-2 h-2 rounded-full bg-purple-600"></span>
                    <span>{{ selectedInvoice()!.isFullyReturned ? 'تم إرجاع هذه الفاتورة بالكامل' : 'تم عمل مرتجع جزئي على هذه الفاتورة' }}</span>
                  </div>
                  <span class="bg-purple-200/70 text-purple-800 px-2.5 py-1 rounded-lg font-black whitespace-nowrap">
                    المبلغ المسترد: {{ selectedInvoice()!.totalRefunded | number:'1.2-2' }} ج.م
                  </span>
                </div>
              }

              <!-- Summary Cards -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <span class="text-xs text-slate-500 font-semibold block">المجموع قبل الخصم</span>
                  <p class="text-base font-black text-slate-800 mt-1">{{ (selectedInvoice()!.subtotal || selectedInvoice()!.totalAmount) | number:'1.2-2' }} ج.م</p>
                </div>
                <div class="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
                  <span class="text-xs text-amber-700 font-semibold block">قيمة الخصم</span>
                  <p class="text-base font-black text-amber-800 mt-1 flex items-baseline gap-1.5">
                    @if (selectedInvoice()!.discountAmount > 0) {
                      <span dir="ltr">-{{ selectedInvoice()!.discountAmount | number:'1.2-2' }}</span>
                      <span class="text-xs font-bold text-amber-600">({{ selectedInvoice()!.discountPercent }}%)</span>
                    } @else {
                      <span>0.00 ج.م</span>
                    }
                  </p>
                </div>
                <div class="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
                  <span class="text-xs text-emerald-700 font-semibold block">الإجمالي النهائي</span>
                  <p class="text-base font-black text-emerald-800 mt-1">{{ selectedInvoice()!.totalAmount | number:'1.2-2' }} ج.م</p>
                </div>
                <div class="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <span class="text-xs text-slate-500 font-semibold block">المدفوع</span>
                  <p class="text-base font-black text-slate-800 mt-1">{{ selectedInvoice()!.amountPaid | number:'1.2-2' }} ج.م</p>
                </div>
              </div>

              <!-- Discount Reason Banner if present -->
              @if (selectedInvoice()!.discountReason) {
                <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
                  <span class="font-bold">سبب الخصم:</span>
                  <span>{{ selectedInvoice()!.discountReason }}</span>
                </div>
              }

              <!-- Items Table -->
              <div class="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                <table class="w-full">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold">
                      <th class="text-right px-4 py-3 min-w-[140px]">المنتج</th>
                      <th class="text-center px-3 py-3 whitespace-nowrap">الوحدة</th>
                      <th class="text-center px-3 py-3 whitespace-nowrap">الكمية المباعة</th>
                      <th class="text-center px-3 py-3 whitespace-nowrap">المرتجع</th>
                      <th class="text-center px-3 py-3 whitespace-nowrap">السعر</th>
                      <th class="text-center px-3 py-3 whitespace-nowrap">الخصم</th>
                      <th class="text-left px-4 py-3 whitespace-nowrap">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-xs">
                    @for (item of selectedInvoice()!.items; track item.id) {
                      <tr [class.bg-purple-50/20]="item.returnedQuantity && item.returnedQuantity > 0" class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-4 py-3.5 font-semibold text-slate-800">{{ item.productNameAr }}</td>
                        <td class="px-3 py-3.5 text-center text-slate-500 font-medium whitespace-nowrap">{{ item.unitName || 'وحدة' }}</td>
                        <td class="px-3 py-3.5 text-center text-slate-800 font-bold whitespace-nowrap">{{ item.quantity }}</td>
                        <td class="px-3 py-3.5 text-center whitespace-nowrap">
                          @if (item.returnedQuantity && item.returnedQuantity > 0) {
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 leading-none">
                              <span>{{ item.returnedQuantity }}</span>
                              <span class="text-[10px] text-purple-600 font-semibold">مرتجع</span>
                            </span>
                          } @else {
                            <span class="text-slate-300 font-mono">—</span>
                          }
                        </td>
                        <td class="px-3 py-3.5 text-center text-slate-600 font-mono whitespace-nowrap">{{ item.unitPriceAtSale | number:'1.2-2' }}</td>
                        <td class="px-3 py-3.5 text-center whitespace-nowrap">
                          @if (item.discountAmount > 0) {
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100/90 text-amber-900 border border-amber-300 leading-none" dir="ltr">
                              <span>-{{ item.discountAmount | number:'1.2-2' }}</span>
                              <span class="text-[10px] text-amber-700 font-semibold">({{ item.discountPercentage }}%)</span>
                            </span>
                          } @else {
                            <span class="text-slate-300 font-mono">—</span>
                          }
                        </td>
                        <td class="px-4 py-3.5 text-left font-black text-slate-900 whitespace-nowrap">
                          {{ item.lineTotal | number:'1.2-2' }} <span class="text-[10px] font-normal text-slate-500">ج.م</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Return Invoice Modal -->
      @if (showReturnModal() && returningInvoice()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="showReturnModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden animate-scale-in" (click)="$event.stopPropagation()">
            <div class="bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                  <span>عمل مرتجع فاتورة بيع</span>
                  <span class="text-xs bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full">{{ returningInvoice()!.invoiceNumber }}</span>
                </h3>
                <p class="text-xs text-purple-200 mt-0.5">حدد الأصناف والكميات المراد استرجاعها وحالتها</p>
              </div>
              <button (click)="showReturnModal.set(false)" class="text-white/70 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div class="p-6 space-y-4 overflow-y-auto flex-1">
              <!-- Invoice Summary -->
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span class="text-[11px] font-bold text-slate-500 block">إجمالي الفاتورة الأصلية</span>
                  <p class="text-sm font-black text-slate-800 mt-0.5">{{ returningInvoice()!.totalAmount | number:'1.2-2' }} ج.م</p>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span class="text-[11px] font-bold text-amber-700 block">تم استرداده مسبقاً</span>
                  <p class="text-sm font-black text-amber-900 mt-0.5">{{ (returningInvoice()!.totalRefunded || 0) | number:'1.2-2' }} ج.م</p>
                </div>
                <div class="bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <span class="text-[11px] font-bold text-purple-700 block">إجمالي هذا المرتجع</span>
                  <p class="text-sm font-black text-purple-900 mt-0.5">{{ calculateRefundTotal() | number:'1.2-2' }} ج.م</p>
                </div>
              </div>

              <!-- Quick action buttons -->
              <div class="flex items-center justify-between pt-1">
                <span class="text-xs font-bold text-slate-700">أصناف الفاتورة:</span>
                <div class="flex gap-2">
                  <button (click)="selectAllReturn()" class="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded-lg">إرجاع الكل</button>
                  <button (click)="deselectAllReturn()" class="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">تفريغ</button>
                </div>
              </div>

              <!-- Return Items Table -->
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th class="text-right px-3 py-2.5">الصنف</th>
                      <th class="text-center px-3 py-2.5">الوحدة</th>
                      <th class="text-center px-3 py-2.5">المتاح للإرجاع</th>
                      <th class="text-center px-3 py-2.5">كمية المرتجع</th>
                      <th class="text-center px-3 py-2.5">الحالة</th>
                      <th class="text-right px-3 py-2.5">سعر الاسترداد</th>
                      <th class="text-right px-3 py-2.5">المسترد</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (item of returnItems(); track item.invoiceItemId) {
                      <tr class="hover:bg-slate-50" [class.bg-purple-50/30]="item.returnQty > 0">
                        <td class="px-3 py-3 font-semibold text-slate-800">{{ item.productNameAr }}</td>
                        <td class="px-3 py-3 text-center text-slate-500 font-medium">{{ item.unitName }}</td>
                        <td class="px-3 py-3 text-center font-bold text-slate-600">{{ item.maxQty }}</td>
                        <td class="px-3 py-3">
                          <div class="flex items-center justify-center gap-1">
                            <button (click)="item.returnQty = Math.max(0, item.returnQty - 1)"
                              [disabled]="item.returnQty <= 0"
                              class="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center text-xs">
                              -
                            </button>
                            <input
                              type="number"
                              [(ngModel)]="item.returnQty"
                              min="0"
                              [max]="item.maxQty"
                              class="w-10 h-6 text-center font-black text-xs text-slate-800 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <button (click)="item.returnQty = Math.min(item.maxQty, item.returnQty + 1)"
                              [disabled]="item.returnQty >= item.maxQty"
                              class="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center text-xs">
                              +
                            </button>
                          </div>
                        </td>
                        <td class="px-3 py-3 text-center">
                          <label class="inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            [class.text-rose-600]="item.isDamaged" [class.text-emerald-700]="!item.isDamaged">
                            <input type="checkbox" [(ngModel)]="item.isDamaged" class="rounded text-rose-600 focus:ring-0 text-xs">
                            <span>{{ item.isDamaged ? 'تالف' : 'سليم' }}</span>
                          </label>
                        </td>
                        <td class="px-3 py-3 text-right">
                          <span class="font-bold text-slate-800">{{ item.unitPrice | number:'1.2-2' }} ج.م</span>
                          @if ((item.discountPercentage ?? 0) > 0) {
                            <span class="block text-[10px] text-amber-600 line-through">{{ item.originalUnitPrice | number:'1.2-2' }} (خصم {{ item.discountPercentage }}%)</span>
                          }
                        </td>
                        <td class="px-3 py-3 text-right font-black text-purple-900">
                          {{ (item.returnQty * item.unitPrice) | number:'1.2-2' }} ج.م
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Return Notice -->
              <div class="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                <span>ℹ️</span>
                <span>سيتم إخراج المبلغ من الدرج النقدي (أو خصمه من مديونية العميل للآجل) وإعادة الأصناف السليمة للمخزن تلقائياً.</span>
              </div>
            </div>

            <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <div class="text-xs">
                <span class="text-slate-500">إجمالي المبلغ المسترد:</span>
                <span class="text-base font-black text-purple-700 mr-2">{{ calculateRefundTotal() | number:'1.2-2' }} ج.م</span>
              </div>
              <div class="flex gap-2">
                <button (click)="showReturnModal.set(false)" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors">إلغاء</button>
                <button (click)="submitReturn()" [disabled]="submittingReturn() || calculateRefundTotal() <= 0"
                  class="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all flex items-center gap-1">
                  @if (submittingReturn()) {
                    <span>جاري التسجيل...</span>
                  } @else {
                    <span>تأكيد تسجيل المرتجع ✓</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Void Confirm -->
      <app-confirm-dialog
        [isOpen]="showVoidConfirm()"
        title="إلغاء الفاتورة"
        [message]="'هل أنت متأكد من إلغاء الفاتورة: ' + (voidingInvoice()?.invoiceNumber || '') + '؟ سيتم إرجاع المخزون.'"
        confirmText="إلغاء الفاتورة"
        mode="danger"
        (confirmed)="voidInvoice()"
        (cancelled)="showVoidConfirm.set(false)">
      </app-confirm-dialog>
    </div>
  `
})
export class SalesComponent implements OnInit {
  protected readonly Math = Math;
  private invoicesService = inject(InvoicesService);
  private returnInvoicesService = inject(ReturnInvoicesService);
  private notify = inject(NotificationService);

  invoices = signal<InvoiceListDto[]>([]);
  loading = signal(false);

  filterStatus = '';
  filterFrom = '';
  filterTo = '';

  currentPage = signal(1);
  totalCount = signal(0);
  totalPages = signal(0);

  selectedInvoice = signal<InvoiceDetailDto | null>(null);

  // Return modal state
  showReturnModal = signal(false);
  returningInvoice = signal<InvoiceDetailDto | null>(null);
  returnItems = signal<{
    invoiceItemId: string;
    productNameAr: string;
    unitName: string;
    unitPrice: number;
    originalUnitPrice: number;
    discountPercentage: number;
    maxQty: number;
    returnQty: number;
    isDamaged: boolean;
  }[]>([]);
  submittingReturn = signal(false);

  showVoidConfirm = signal(false);
  voidingInvoice = signal<InvoiceListDto | null>(null);

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.loading.set(true);
    this.invoicesService.getAll({
      pageNumber: this.currentPage(),
      pageSize: 15,
      paymentStatus: this.filterStatus || undefined,
      fromDate: this.filterFrom || undefined,
      toDate: this.filterTo || undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.invoices.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  viewInvoiceDetails(inv: InvoiceListDto) {
    this.invoicesService.getById(inv.id).subscribe({
      next: (res) => {
        if (res.success) this.selectedInvoice.set(res.data);
      }
    });
  }

  confirmVoidInvoice(inv: InvoiceListDto) {
    this.voidingInvoice.set(inv);
    this.showVoidConfirm.set(true);
  }

  // ── Return Actions ──

  openReturnModal(inv: InvoiceListDto) {
    this.invoicesService.getById(inv.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.returningInvoice.set(res.data);
          const invoiceDisc = res.data.discountPercent || 0;
          const items = res.data.items.map(i => {
            const max = i.remainingReturnableQuantity != null ? i.remainingReturnableQuantity : i.quantity;
            const itemDisc = i.discountPercentage || 0;
            let effectiveUnitPrice = i.netUnitPrice ?? (i.unitPriceAtSale * (1 - itemDisc / 100));
            if (invoiceDisc > 0 && itemDisc === 0) {
              effectiveUnitPrice = effectiveUnitPrice * (1 - invoiceDisc / 100);
            }
            effectiveUnitPrice = Math.round(effectiveUnitPrice * 100) / 100;

            const effectiveDiscPercent = itemDisc > 0 
              ? itemDisc 
              : (invoiceDisc > 0 ? invoiceDisc : 0);

            return {
              invoiceItemId: i.id,
              productNameAr: i.productNameAr,
              unitName: i.unitName || 'وحدة',
              unitPrice: effectiveUnitPrice,
              originalUnitPrice: i.unitPriceAtSale,
              discountPercentage: effectiveDiscPercent,
              maxQty: max,
              returnQty: max, // default to all
              isDamaged: false
            };
          });
          this.returnItems.set(items);
          this.showReturnModal.set(true);
        }
      }
    });
  }

  calculateRefundTotal(): number {
    return this.returnItems().reduce((sum, item) => sum + (item.returnQty * item.unitPrice), 0);
  }

  selectAllReturn() {
    this.returnItems.update(items =>
      items.map(i => ({ ...i, returnQty: i.maxQty }))
    );
  }

  deselectAllReturn() {
    this.returnItems.update(items =>
      items.map(i => ({ ...i, returnQty: 0 }))
    );
  }

  submitReturn() {
    const inv = this.returningInvoice();
    if (!inv) return;

    const itemsToReturn = this.returnItems().filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      this.notify.warning('يرجى تحديد كمية صنف واحد على الأقل للمرتجع');
      return;
    }

    this.submittingReturn.set(true);
    const request: CreateReturnRequest = {
      originalInvoiceId: inv.id,
      items: itemsToReturn.map(i => ({
        invoiceItemId: i.invoiceItemId,
        quantity: i.returnQty,
        isDamaged: i.isDamaged
      }))
    };

    this.returnInvoicesService.create(request).subscribe({
      next: (res) => {
        this.submittingReturn.set(false);
        if (res.success) {
          this.notify.success('تم تسجيل المرتجع بنجاح وحساب رصيد الخزينة والمخزن');
          this.showReturnModal.set(false);
          this.loadInvoices();
        }
      },
      error: (err) => {
        this.submittingReturn.set(false);
        this.notify.error(err.error?.message || 'فشل تسجيل المرتجع');
      }
    });
  }

  voidInvoice() {
    const inv = this.voidingInvoice();
    if (!inv) return;
    this.invoicesService.void(inv.id).subscribe({
      next: () => {
        this.notify.success('تم إلغاء الفاتورة بنجاح');
        this.showVoidConfirm.set(false);
        this.loadInvoices();
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadInvoices();
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService, PurchaseInvoicesService } from '../../core/services/suppliers.service';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { BrandsService } from '../../core/services/brands.service';
import { NotificationService } from '../../core/services/notification.service';
import { SupplierListDto, CreateSupplierDto, PurchaseInvoiceListDto, PurchaseInvoiceDetailDto, CreatePurchaseRequest, PurchaseItemRequest } from '../../core/models/purchase.model';
import { ProductListDto, CreateProductDto } from '../../core/models/product.model';
import { CategoryDto, BrandDto } from '../../core/models/category-brand.model';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800">المشتريات والموردين</h2>
          <p class="text-sm text-slate-500 mt-1">إدارة الموردين وتسجيل فواتير الشراء</p>
        </div>
        <div class="flex gap-3">
          <button (click)="showSupplierModal.set(true)"
            class="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            مورد جديد
          </button>
          <button (click)="openPurchaseForm()"
            class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            فاتورة شراء جديدة
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        <button (click)="activeView.set('invoices')"
          [class]="activeView() === 'invoices' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
          class="px-5 py-2 rounded-lg text-sm font-semibold transition-all">فواتير الشراء</button>
        <button (click)="activeView.set('suppliers')"
          [class]="activeView() === 'suppliers' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
          class="px-5 py-2 rounded-lg text-sm font-semibold transition-all">الموردين</button>
      </div>

      <!-- Suppliers View -->
      @if (activeView() === 'suppliers') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">الاسم</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">الهاتف</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/6">الحالة</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (sup of suppliers(); track sup.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-semibold text-slate-800">{{ sup.name }}</td>
                    <td class="px-5 py-3.5 text-sm text-slate-600 text-right">
                      <span dir="ltr" class="font-mono inline-block">{{ sup.phone || '—' }}</span>
                    </td>
                    <td class="px-5 py-3.5">
                      <span [class]="sup.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'" class="text-xs font-bold px-2.5 py-1 rounded-full">
                        {{ sup.isActive ? 'نشط' : 'غير نشط' }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-slate-500">{{ sup.createdAt | date:'yyyy/MM/dd' }}</td>
                  </tr>
                }
                @if (suppliers().length === 0) {
                  <tr><td colspan="4" class="text-center py-16 text-slate-400 text-sm">لا يوجد موردين بعد</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Purchase Invoices View -->
      @if (activeView() === 'invoices') {
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
                    <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">المورد</th>
                    <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">عدد الأصناف</th>
                    <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الإجمالي</th>
                    <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">التاريخ</th>
                    <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">إجراءات</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (pi of purchaseInvoices(); track pi.id) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="px-5 py-3.5 text-sm font-bold text-slate-800">{{ pi.invoiceNumber }}</td>
                      <td class="px-5 py-3.5 text-sm text-slate-600 font-semibold">{{ pi.supplierName }}</td>
                      <td class="px-5 py-3.5 text-sm text-slate-500">{{ pi.itemCount }} صنف</td>
                      <td class="px-5 py-3.5 text-sm font-bold text-slate-800">{{ pi.totalAmount | number:'1.2-2' }} ج.م</td>
                      <td class="px-5 py-3.5 text-sm text-slate-500">{{ pi.purchaseDate | date:'yyyy/MM/dd' }}</td>
                      <td class="px-5 py-3.5">
                        <button (click)="viewPurchaseDetails(pi)"
                          class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="عرض التفاصيل">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                      </td>
                    </tr>
                  }
                  @if (purchaseInvoices().length === 0) {
                    <tr><td colspan="6" class="text-center py-16 text-slate-400 text-sm">لا توجد فواتير شراء بعد</td></tr>
                  }
                </tbody>
              </table>
            </div>

            @if (totalPages() > 1) {
              <div class="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <span class="text-xs text-slate-500">عرض {{ purchaseInvoices().length }} من {{ totalCount() }} فاتورة</span>
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
      }

      <!-- Add Supplier Modal -->
      @if (showSupplierModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="showSupplierModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" (click)="$event.stopPropagation()">
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5">
              <h3 class="text-lg font-bold text-white">إضافة مورد جديد</h3>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5">اسم المورد *</label>
                <input type="text" [(ngModel)]="supName" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5">رقم الهاتف</label>
                <input type="text" [(ngModel)]="supPhone" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5">العنوان</label>
                <input type="text" [(ngModel)]="supAddress" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
              </div>
            </div>
            <div class="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button (click)="showSupplierModal.set(false)" class="px-5 py-2 text-sm font-semibold text-slate-600">إلغاء</button>
              <button (click)="addSupplier()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all">إضافة</button>
            </div>
          </div>
        </div>
      }

      <!-- New Purchase Invoice Modal -->
      @if (showPurchaseModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="showPurchaseModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-auto flex flex-col" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-white">فاتورة شراء جديدة</h3>
                <p class="text-xs text-slate-300 mt-0.5">تسجيل بضاعة جديدة وتحديث أسعار التكلفة والبيع والمخزون</p>
              </div>
              <button (click)="showPurchaseModal.set(false)" class="text-slate-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div class="p-6 space-y-5 flex-1">
              <!-- Supplier & Date & Notes -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">المورد *</label>
                  <select [(ngModel)]="purchaseSupplierId" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-semibold">
                    <option value="">اختر المورد</option>
                    @for (sup of suppliers(); track sup.id) {
                      <option [value]="sup.id">{{ sup.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">تاريخ الشراء *</label>
                  <input type="date" [(ngModel)]="purchaseDate" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">ملاحظات الفاتورة</label>
                  <input type="text" [(ngModel)]="purchaseNotes" placeholder="رقم إذن الاستلام أو ملاحظات" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
                </div>
              </div>

              <!-- Invoice Items Table -->
              <div class="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30">
                <div class="p-4 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-sm">📦</span>
                    <h4 class="text-sm font-bold text-slate-800">أصناف الفاتورة والتسعير</h4>
                  </div>
                  <span class="text-xs text-slate-500 font-semibold">{{ purchaseItems.length }} بند مضاف</span>
                </div>

                <div class="p-4 space-y-3">
                  @for (item of purchaseItems; track $index; let i = $index) {
                    <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <!-- Product Selection + Quick Add -->
                        <div class="sm:col-span-4">
                          <div class="flex items-center justify-between mb-1">
                            <label class="block text-[11px] font-bold text-slate-600">المنتج *</label>
                            <button
                              type="button"
                              (click)="openQuickProductModal(i)"
                              class="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 transition-colors">
                              <span>+ منتج جديد</span>
                            </button>
                          </div>
                          <select
                            [(ngModel)]="item.productId"
                            (ngModelChange)="onProductSelected(item)"
                            class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30">
                            <option value="">اختر المنتج...</option>
                            @for (p of allProducts(); track p.id) {
                              <option [value]="p.id">{{ p.nameAr }} (بيع: {{ p.sellingPrice }} ج.م)</option>
                            }
                          </select>
                        </div>

                        <!-- Quantity -->
                        <div class="sm:col-span-2">
                          <label class="block text-[11px] font-bold text-slate-600 mb-1">الكمية (علبة) *</label>
                          <input type="number" [(ngModel)]="item.quantity" min="1"
                            class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"/>
                        </div>

                        <!-- Cost Price -->
                        <div class="sm:col-span-2">
                          <label class="block text-[11px] font-bold text-slate-600 mb-1">سعر الشراء (التكلفة) *</label>
                          <input type="number" [(ngModel)]="item.unitCost" min="0" step="0.5" placeholder="0.00"
                            class="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/30 text-xs font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-500/30"/>
                        </div>

                        <!-- Selling Price (New or Current) -->
                        <div class="sm:col-span-2">
                          <div class="flex items-center justify-between mb-1">
                            <label class="text-[11px] font-bold text-slate-600">سعر البيع</label>
                            @if (getItemProfitMargin(item) !== null) {
                              <span class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1 rounded">
                                +{{ getItemProfitMargin(item) }}%
                              </span>
                            }
                          </div>
                          <input type="number" [(ngModel)]="item.newSellingPrice" min="0" step="0.5" placeholder="سعر البيع"
                            class="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50/20 text-xs font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                        </div>

                        <!-- Expiry Date -->
                        <div class="sm:col-span-2">
                          <label class="block text-[11px] font-bold text-slate-600 mb-1">تاريخ الصلاحية *</label>
                          <input type="date" [(ngModel)]="item.expiryDate"
                            class="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-700"/>
                        </div>
                      </div>

                      <!-- Subtotal & Actions -->
                      <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div class="flex items-center gap-3 text-slate-500">
                          <span>إجمالي البند: <b class="text-slate-800 font-mono">{{ ((item.quantity || 0) * (item.unitCost || 0)) | number:'1.2-2' }} ج.م</b></span>
                          @if (item.newSellingPrice && item.unitCost && item.newSellingPrice > item.unitCost) {
                            <span class="text-emerald-700 font-semibold text-[11px]">
                              ربح العلبة: {{ (item.newSellingPrice - item.unitCost) | number:'1.2-2' }} ج.م
                            </span>
                          }
                        </div>
                        <button
                          type="button"
                          (click)="removePurchaseItem(i)"
                          [disabled]="purchaseItems.length === 1"
                          class="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                          حذف البند ✕
                        </button>
                      </div>
                    </div>
                  }

                  <div class="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      (click)="addPurchaseItem()"
                      class="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                      <span>إضافة صنف آخر للفاتورة</span>
                    </button>

                    <!-- Invoice Total Preview -->
                    <div class="bg-white border border-slate-200 px-5 py-2.5 rounded-xl flex items-center gap-4 shadow-2xs">
                      <span class="text-xs text-slate-500 font-bold">إجمالي الفاتورة المطلوب سداده:</span>
                      <span class="text-lg font-black text-slate-900 font-mono">{{ getPurchaseInvoiceTotal() | number:'1.2-2' }} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 sticky bottom-0 z-10">
              <button (click)="showPurchaseModal.set(false)" class="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">إلغاء</button>
              <button (click)="submitPurchase()" [disabled]="saving()"
                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20">
                {{ saving() ? 'جاري الحفظ...' : 'تسجيل وحفظ الفاتورة ✓' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Quick Add Product Modal (Popup from inside purchase invoice) -->
      @if (showQuickProductModal()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs" (click)="showQuickProductModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scale-in" (click)="$event.stopPropagation()">
            <div class="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-white">إضافة منتج جديد سريع</h3>
                <p class="text-[11px] text-emerald-100">سيتم حفظ الصنف في قاعدة البيانات وإدراجه فوراً بالفاتورة</p>
              </div>
              <button (click)="showQuickProductModal.set(false)" class="text-emerald-200 hover:text-white">✕</button>
            </div>

            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">اسم المنتج بالعربي *</label>
                <input type="text" [(ngModel)]="quickNameAr" placeholder="مثلاً: كتافلام 50 مجم 20 قرص"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-semibold"/>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-slate-700">الباركود *</label>
                  <button type="button" (click)="quickBarcode = generateBarcode()" class="text-[11px] text-emerald-700 font-bold hover:underline">
                    توليد باركود تلقائي ⚡
                  </button>
                </div>
                <input type="text" [(ngModel)]="quickBarcode" placeholder="امسح بالسكانر أو اكتب الباركود"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-slate-700">التصنيف</label>
                    <button type="button" (click)="inlineCatOpen = !inlineCatOpen; inlineCatName = ''" class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">
                      {{ inlineCatOpen ? 'إلغاء' : '+ جديد' }}
                    </button>
                  </div>
                  @if (inlineCatOpen) {
                    <div class="flex gap-1.5">
                      <input type="text" [(ngModel)]="inlineCatName" (keydown.enter)="$event.preventDefault(); quickAddCategory()" placeholder="اسم التصنيف" class="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-emerald-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30">
                      <button type="button" (click)="quickAddCategory()" [disabled]="inlineSaving || !inlineCatName.trim()" class="px-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">حفظ</button>
                    </div>
                  } @else {
                    <select [(ngModel)]="quickCategoryId" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30">
                      <option value="">اختر التصنيف</option>
                      @for (cat of categories(); track cat.id) {
                        <option [value]="cat.id">{{ cat.nameAr }}</option>
                      }
                    </select>
                  }
                </div>
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-slate-700">الشركة / الماركة</label>
                    <button type="button" (click)="inlineBrandOpen = !inlineBrandOpen; inlineBrandName = ''" class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">
                      {{ inlineBrandOpen ? 'إلغاء' : '+ جديد' }}
                    </button>
                  </div>
                  @if (inlineBrandOpen) {
                    <div class="flex gap-1.5">
                      <input type="text" [(ngModel)]="inlineBrandName" (keydown.enter)="$event.preventDefault(); quickAddBrand()" placeholder="اسم الماركة" class="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-emerald-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30">
                      <button type="button" (click)="quickAddBrand()" [disabled]="inlineSaving || !inlineBrandName.trim()" class="px-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">حفظ</button>
                    </div>
                  } @else {
                    <select [(ngModel)]="quickBrandId" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30">
                      <option value="">اختر الماركة</option>
                      @for (brand of brands(); track brand.id) {
                        <option [value]="brand.id">{{ brand.nameAr }}</option>
                      }
                    </select>
                  }
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">سعر الشراء (التكلفة) *</label>
                  <input type="number" [(ngModel)]="quickPurchasePrice" min="0" step="0.5" placeholder="0.00"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-amber-800 outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">سعر البيع للجمهور *</label>
                  <input type="number" [(ngModel)]="quickSellingPrice" min="0" step="0.5" placeholder="0.00"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                </div>
              </div>

              @if (quickSellingPrice && quickPurchasePrice && quickSellingPrice > quickPurchasePrice) {
                <div class="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
                  <span>الربح للعلبة: {{ (quickSellingPrice - quickPurchasePrice) | number:'1.2-2' }} ج.م</span>
                  <span>هامش ربح: {{ (((quickSellingPrice - quickPurchasePrice) / quickPurchasePrice) * 100) | number:'1.1-1' }}%</span>
                </div>
              }
            </div>

            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button (click)="showQuickProductModal.set(false)" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">إلغاء</button>
              <button (click)="saveQuickProduct()" [disabled]="quickSaving()"
                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all disabled:opacity-50">
                {{ quickSaving() ? 'جاري الحفظ...' : 'حفظ وإدراج بالفاتورة ✓' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Purchase Detail Modal -->
      @if (selectedPurchase()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="selectedPurchase.set(null)">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto" (click)="$event.stopPropagation()">
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex justify-between items-center sticky top-0">
              <div>
                <h3 class="text-lg font-bold text-white">تفاصيل فاتورة الشراء</h3>
                <p class="text-sm text-slate-300 mt-0.5">{{ selectedPurchase()!.invoiceNumber }} — {{ selectedPurchase()!.supplierName }}</p>
              </div>
              <button (click)="selectedPurchase.set(null)" class="text-slate-400 hover:text-white"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div class="p-6">
              <table class="w-full">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">المنتج</th>
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">الكمية</th>
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">سعر الشراء</th>
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">سعر البيع</th>
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">الصلاحية</th>
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">الإجمالي</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of selectedPurchase()!.items; track item.id) {
                    <tr>
                      <td class="px-4 py-3 text-sm font-semibold text-slate-700">{{ item.productNameAr }}</td>
                      <td class="px-4 py-3 text-sm text-slate-600 font-bold">{{ item.quantity }}</td>
                      <td class="px-4 py-3 text-sm text-amber-800 font-bold font-mono">{{ item.unitCost | number:'1.2-2' }}</td>
                      <td class="px-4 py-3 text-sm text-emerald-700 font-bold font-mono">{{ item.sellingPrice ? (item.sellingPrice | number:'1.2-2') : '—' }}</td>
                      <td class="px-4 py-3 text-sm text-slate-500">{{ item.expiryDate | date:'yyyy/MM/dd' }}</td>
                      <td class="px-4 py-3 text-sm font-bold text-slate-800 font-mono">{{ item.lineTotal | number:'1.2-2' }} ج.م</td>
                    </tr>
                  }
                </tbody>
              </table>
              <div class="mt-4 flex justify-end">
                <div class="bg-slate-50 rounded-xl px-6 py-3">
                  <span class="text-xs text-slate-500 font-semibold">إجمالي الفاتورة: </span>
                  <span class="text-lg font-black text-slate-800 font-mono">{{ selectedPurchase()!.totalAmount | number:'1.2-2' }} ج.م</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PurchasesComponent implements OnInit {
  private suppliersService = inject(SuppliersService);
  private purchaseInvoicesService = inject(PurchaseInvoicesService);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private brandsService = inject(BrandsService);
  private notify = inject(NotificationService);

  suppliers = signal<SupplierListDto[]>([]);
  purchaseInvoices = signal<PurchaseInvoiceListDto[]>([]);
  allProducts = signal<ProductListDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  brands = signal<BrandDto[]>([]);
  loading = signal(false);
  saving = signal(false);

  activeView = signal<'invoices' | 'suppliers'>('invoices');
  currentPage = signal(1);
  totalCount = signal(0);
  totalPages = signal(0);

  // Add Supplier
  showSupplierModal = signal(false);
  supName = '';
  supPhone = '';
  supAddress = '';

  // New Purchase
  showPurchaseModal = signal(false);
  purchaseSupplierId = '';
  purchaseDate = new Date().toISOString().split('T')[0];
  purchaseNotes = '';
  purchaseItems: PurchaseItemRequest[] = [{ productId: '', quantity: 1, unitCost: 0, newSellingPrice: 0, expiryDate: '' }];

  // Quick Product Modal
  showQuickProductModal = signal(false);
  quickProductTargetIndex: number | null = null;
  quickNameAr = '';
  quickBarcode = '';
  quickCategoryId = '';
  quickBrandId = '';
  inlineCatOpen = false;
  inlineCatName = '';
  inlineBrandOpen = false;
  inlineBrandName = '';
  inlineSaving = false;
  quickSellingPrice = 0;
  quickPurchasePrice: number | null = null;
  quickSaving = signal(false);

  // Detail
  selectedPurchase = signal<PurchaseInvoiceDetailDto | null>(null);

  ngOnInit() {
    this.loadSuppliers();
    this.loadPurchaseInvoices();
    this.loadAllProducts();
    this.loadCategories();
    this.loadBrands();
  }

  loadSuppliers() {
    this.suppliersService.getAll({ pageSize: 100 }).subscribe({
      next: (res) => { if (res.success) this.suppliers.set(res.data.items); }
    });
  }

  loadCategories() {
    this.categoriesService.getAll({ pageSize: 100 }).subscribe({
      next: (res) => { if (res.success) this.categories.set(res.data.items); }
    });
  }

  loadBrands() {
    this.brandsService.getAll({ pageSize: 100 }).subscribe({
      next: (res) => { if (res.success) this.brands.set(res.data.items); }
    });
  }

  quickAddCategory() {
    const name = this.inlineCatName.trim();
    if (!name || this.inlineSaving) return;
    this.inlineSaving = true;
    this.categoriesService.create({ nameAr: name }).subscribe({
      next: (res) => {
        this.inlineSaving = false;
        if (res.success) {
          this.notify.success('تم إضافة التصنيف');
          this.categories.update(list => [...list, { id: res.data, nameAr: name } as any]);
          this.quickCategoryId = res.data;
          this.inlineCatOpen = false;
          this.inlineCatName = '';
          this.loadCategories();
        } else {
          this.notify.error(res.message || 'تعذر إضافة التصنيف');
        }
      },
      error: (err) => { this.inlineSaving = false; this.notify.error(err?.error?.message || 'تعذر إضافة التصنيف'); }
    });
  }

  quickAddBrand() {
    const name = this.inlineBrandName.trim();
    if (!name || this.inlineSaving) return;
    this.inlineSaving = true;
    this.brandsService.create({ nameAr: name }).subscribe({
      next: (res) => {
        this.inlineSaving = false;
        if (res.success) {
          this.notify.success('تم إضافة الماركة');
          this.brands.update(list => [...list, { id: res.data, nameAr: name } as any]);
          this.quickBrandId = res.data;
          this.inlineBrandOpen = false;
          this.inlineBrandName = '';
          this.loadBrands();
        } else {
          this.notify.error(res.message || 'تعذر إضافة الماركة');
        }
      },
      error: (err) => { this.inlineSaving = false; this.notify.error(err?.error?.message || 'تعذر إضافة الماركة'); }
    });
  }

  loadPurchaseInvoices() {
    this.loading.set(true);
    this.purchaseInvoicesService.getAll({ page: this.currentPage(), pageSize: 15 }).subscribe({
      next: (res) => {
        if (res.success) {
          this.purchaseInvoices.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadAllProducts() {
    this.productsService.getAll({ pageSize: 300 }).subscribe({
      next: (res) => { if (res.success) this.allProducts.set(res.data.items); }
    });
  }

  addSupplier() {
    if (!this.supName.trim()) { this.notify.error('يرجى إدخال اسم المورد'); return; }
    this.suppliersService.create({
      name: this.supName,
      phone: this.supPhone || undefined,
      address: this.supAddress || undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('تم إضافة المورد بنجاح');
          this.showSupplierModal.set(false);
          this.supName = ''; this.supPhone = ''; this.supAddress = '';
          this.loadSuppliers();
        }
      }
    });
  }

  openPurchaseForm() {
    this.purchaseSupplierId = '';
    this.purchaseDate = new Date().toISOString().split('T')[0];
    this.purchaseNotes = '';
    this.purchaseItems = [{ productId: '', quantity: 1, unitCost: 0, newSellingPrice: 0, expiryDate: '' }];
    this.showPurchaseModal.set(true);
  }

  addPurchaseItem() {
    this.purchaseItems = [...this.purchaseItems, { productId: '', quantity: 1, unitCost: 0, newSellingPrice: 0, expiryDate: '' }];
  }

  removePurchaseItem(index: number) {
    this.purchaseItems = this.purchaseItems.filter((_, i) => i !== index);
  }

  onProductSelected(item: PurchaseItemRequest) {
    const p = this.allProducts().find(x => x.id === item.productId);
    if (p) {
      if (!item.unitCost || item.unitCost === 0) {
        item.unitCost = p.averageCost || 0;
      }
      item.newSellingPrice = p.sellingPrice || 0;
    }
  }

  getItemProfitMargin(item: PurchaseItemRequest): number | null {
    if (!item.unitCost || item.unitCost <= 0 || !item.newSellingPrice || item.newSellingPrice <= item.unitCost) {
      return null;
    }
    return Math.round(((item.newSellingPrice - item.unitCost) / item.unitCost) * 100);
  }

  getPurchaseInvoiceTotal(): number {
    return this.purchaseItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitCost || 0)), 0);
  }

  // Quick Product Modal Methods
  openQuickProductModal(itemIndex: number) {
    this.quickProductTargetIndex = itemIndex;
    this.quickNameAr = '';
    this.quickBarcode = this.generateBarcode();
    const cats = this.categories();
    this.quickCategoryId = cats.length > 0 ? cats[0].id : '';
    const brs = this.brands();
    this.quickBrandId = brs.length > 0 ? brs[0].id : '';
    this.quickSellingPrice = 0;
    this.quickPurchasePrice = null;
    this.showQuickProductModal.set(true);
  }

  generateBarcode(): string {
    return '622' + Math.floor(100000000 + Math.random() * 900000000).toString();
  }

  saveQuickProduct() {
    if (!this.quickNameAr.trim() || !this.quickBarcode.trim() || !this.quickSellingPrice) {
      this.notify.error('يرجى كتابة اسم المنتج والباركود وسعر البيع');
      return;
    }
    if (!this.quickCategoryId || !this.quickBrandId) {
      this.notify.error('يرجى اختيار التصنيف والعلامة التجارية');
      return;
    }
    this.quickSaving.set(true);
    const dto: CreateProductDto = {
      nameAr: this.quickNameAr,
      barcode: this.quickBarcode,
      categoryId: this.quickCategoryId,
      brandId: this.quickBrandId,
      sellingPrice: Number(this.quickSellingPrice),
      purchasePrice: this.quickPurchasePrice ? Number(this.quickPurchasePrice) : undefined
    };

    this.productsService.create(dto).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('تمت إضافة المنتج بنجاح وإدراجه في الفاتورة');
          const newProductId = res.data;
          this.loadAllProducts();
          if (this.quickProductTargetIndex !== null && this.purchaseItems[this.quickProductTargetIndex]) {
            const item = this.purchaseItems[this.quickProductTargetIndex];
            item.productId = newProductId;
            item.unitCost = this.quickPurchasePrice || 0;
            item.newSellingPrice = this.quickSellingPrice || 0;
          }
          this.showQuickProductModal.set(false);
        }
        this.quickSaving.set(false);
      },
      error: () => this.quickSaving.set(false)
    });
  }

  submitPurchase() {
    if (!this.purchaseSupplierId) { this.notify.error('يرجى اختيار المورد'); return; }
    const validItems = this.purchaseItems
      .filter(i => i.productId && i.quantity > 0 && i.unitCost > 0)
      .map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitCost: Number(i.unitCost),
        newSellingPrice: i.newSellingPrice ? Number(i.newSellingPrice) : undefined,
        expiryDate: i.expiryDate
      }));

    if (validItems.length === 0) { this.notify.error('يرجى إضافة صنف واحد على الأقل مع تحديد الكمية وسعر الشراء'); return; }

    this.saving.set(true);
    const request: CreatePurchaseRequest = {
      supplierId: this.purchaseSupplierId,
      purchaseDate: this.purchaseDate,
      notes: this.purchaseNotes || undefined,
      items: validItems
    };
    this.purchaseInvoicesService.create(request).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('تم تسجيل فاتورة الشراء وتحديث الأسعار والمخزون بنجاح');
          this.showPurchaseModal.set(false);
          this.saving.set(false);
          this.loadPurchaseInvoices();
        }
      },
      error: () => this.saving.set(false)
    });
  }

  viewPurchaseDetails(pi: PurchaseInvoiceListDto) {
    this.purchaseInvoicesService.getById(pi.id).subscribe({
      next: (res) => { if (res.success) this.selectedPurchase.set(res.data); }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadPurchaseInvoices();
  }
}

import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { InvoicesService } from '../../core/services/invoices.service';
import { CustomersService } from '../../core/services/customers.service';
import { PrintService } from '../../core/services/print.service';
import { NotificationService } from '../../core/services/notification.service';
import { CartStore, CartItem } from '../../core/stores/cart.store';
import { ProductListDto, ProductUnitDto, CreateProductUnitRequest } from '../../core/models/product.model';
import { CustomerListDto } from '../../core/models/customer.model';
import { CreateSaleRequest } from '../../core/models/invoice.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BarcodeListenerDirective } from '../../shared/directives/barcode-listener.directive';
import { CategoryDto, BrandDto } from '../../core/models/category-brand.model';
import { ApiService } from '../../core/services/api.service';
import { ProductListComponent } from './components/product-list/product-list.component';
import { AddToCartEvent } from './components/product-row/product-row.component';
import { CategoryComboboxComponent } from './components/category-combobox/category-combobox.component';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    BarcodeListenerDirective,
    ProductListComponent,
    CategoryComboboxComponent
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col lg:flex-row gap-5"
      appBarcodeListener
      (barcodeScanned)="onBarcodeScanned($event)">

      <!-- ██ LEFT PANEL: Products & Search ██ -->
      <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-0">

        <!-- Search & Category Filters: Single Top Bar -->
        <div class="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center gap-2.5">
          <!-- Large Search Input with Autofocus -->
          <div class="relative flex-1">
            <input
              #searchInput
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearchChange($event)"
              (keydown.enter)="onSearchEnter()"
              placeholder="امسح الباركود أو ابحث عن الصنف بالاسم..."
              class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 ps-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100"
              autofocus
            />
            <svg class="w-4 h-4 text-slate-400 absolute start-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            @if (searchQuery().trim()) {
              <button (click)="clearSearch()" class="absolute end-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs">
                ✕
              </button>
            }
          </div>

          <!-- Category Select Combobox with Search -->
          <div class="w-48 sm:w-64 flex-shrink-0">
            <app-category-combobox
              [categories]="categories()"
              [selectedCategory]="selectedCategory()"
              (categoryChange)="onCategoryChange($event)"
            />
          </div>

          <!-- Clear All Filters Button -->
          @if (searchQuery().trim() || selectedCategory() !== null) {
            <button
              type="button"
              (click)="clearFilters()"
              class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors flex-shrink-0"
              title="مسح البحث والفلترة"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          }
        </div>

        <!-- Products List Area -->
        <div class="flex-1 overflow-hidden p-3 min-h-0">
          <app-product-list
            [products]="products()"
            [isLoading]="isLoadingProducts()"
            [hasError]="hasProductsError()"
            [isInitialState]="isInitialState()"
            [cartQuantities]="cartQuantitiesMap()"
            (addToCart)="onProductAddToCart($event)"
            (retry)="loadProducts()"
          />
        </div>
      </div>

      <!-- ██ RIGHT PANEL: Cart & Checkout ██ -->
      <div class="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">

        <!-- Cart Header -->
        <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <h3 class="font-bold text-sm">سلة المبيعات ({{ cart.itemCount() }})</h3>
          </div>
          @if (cart.itemCount() > 0) {
            <button (click)="showClearConfirm.set(true)" class="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors">
              تفريغ السلة
            </button>
          }
        </div>

        <!-- Customer Selection -->
        <div class="p-3 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            @if (cart.selectedCustomer()) {
              <span class="text-xs font-bold text-slate-700 flex-1">{{ cart.selectedCustomer()!.name }}</span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                [class]="cart.selectedCustomer()!.balance > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'">
                {{ cart.selectedCustomer()!.balance | number:'1.2-2' }} ج.م
              </span>
              <button (click)="cart.selectCustomer(null)" class="text-[10px] text-slate-400 hover:text-rose-500">✕</button>
            } @else {
              <input
                type="text"
                [(ngModel)]="customerSearchQuery"
                (ngModelChange)="searchCustomers($event)"
                placeholder="عميل نقدي — (F2 للبحث)"
                class="flex-1 text-xs bg-transparent border-0 focus:outline-none text-slate-600 font-medium"
              />
            }
          </div>
          <!-- Customer Dropdown -->
          @if (filteredCustomers().length > 0 && customerSearchQuery.length > 0) {
            <div class="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
              @for (customer of filteredCustomers(); track customer.id) {
                <button
                  (click)="selectCustomer(customer)"
                  class="w-full text-right px-3 py-2 text-xs hover:bg-emerald-50 flex justify-between items-center">
                  <span class="font-semibold">{{ customer.name }}</span>
                  <span class="text-[10px] text-slate-400">{{ customer.phone }}</span>
                </button>
              }
            </div>
          }
        </div>

        <!-- Cart Items List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          @if (cart.itemCount() === 0) {
            <div class="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <svg class="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <p class="text-sm font-bold text-slate-600">السلة فارغة حالياً</p>
              <p class="text-xs text-slate-400 mt-1">اختر الأصناف أو امسح الباركود للبدء</p>
            </div>
          } @else {
            @for (item of cart.items(); track item.productId) {
              <div class="p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all"
                [class]="item.hasError || cart.isStockExceeded(item) ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'">
                <div class="flex items-start justify-between gap-1">
                  <div class="flex-1 min-w-0 pr-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <h5 class="text-xs font-bold text-slate-800 truncate">{{ item.nameAr }}</h5>
                      <button (click)="openItemDetailsModal(item)"
                        class="px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all flex items-center gap-0.5 flex-shrink-0"
                        title="تفاصيل الصنف: سعر الشراء والبيع والوحدات">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>تفاصيل</span>
                      </button>
                    </div>

                    <!-- Price Info: Purchase vs Sale -->
                    <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span class="text-[11px] font-bold text-slate-700">
                        {{ item.sellingPrice | number:'1.2-2' }} ج.م
                        @if (item.unitName) {
                          <span class="text-[10px] text-slate-400 font-medium">/ {{ item.unitName }}</span>
                        }
                      </span>
                      <span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="سعر الشراء / التكلفة">
                        شراء: {{ (item.unitCostPrice || item.costPrice || 0) | number:'1.2-2' }} ج.م
                      </span>
                      <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="إجمالي السعر">
                        = {{ (item.sellingPrice * item.quantity) | number:'1.2-2' }} ج.م
                      </span>
                    </div>
                  </div>

                  <!-- Quantity Controls with direct editable input -->
                  <div class="flex items-center gap-1 flex-shrink-0 pt-0.5">
                    <button (click)="cart.decreaseQty(item.productId)" class="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center text-xs">
                      -
                    </button>
                    <input
                      type="number"
                      [ngModel]="item.quantity"
                      (ngModelChange)="cart.updateQuantity(item.productId, $event)"
                      min="1"
                      class="w-10 h-6 text-center font-bold text-xs text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button (click)="cart.increaseQty(item.productId)" class="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center text-xs">
                      +
                    </button>
                    <button (click)="cart.removeItem(item.productId)" class="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 flex items-center justify-center text-xs mr-0.5" title="حذف">
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Unit Chips & Quick Add Unit -->
                <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
                  <span class="text-[10px] text-slate-500 font-bold">الوحدة:</span>
                  @if (item.units && item.units.length > 0) {
                    @for (u of item.units; track u.id) {
                      <button
                        type="button"
                        (click)="cart.changeUnit(item.productId, u)"
                        [class]="item.unitId === u.id
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 font-medium'"
                        class="text-[10px] px-2 py-0.5 rounded-lg transition-all">
                        {{ u.name }} ({{ u.salePrice | number:'1.2-2' }} ج.م)
                      </button>
                    }
                  }
                  <button
                    type="button"
                    (click)="openAddUnitModal(item)"
                    class="text-[10px] px-1.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold transition-all flex items-center gap-0.5"
                    title="إضافة وحدة بيع جديدة للصنف">
                    <span>+ وحدة</span>
                  </button>
                </div>

                <!-- Stock Warnings -->
                @if (cart.isStockExceeded(item)) {
                  <p class="text-[10px] text-rose-600 font-bold">
                    ⚠️ الكمية المطلوبة ({{ item.quantity * (item.conversionFactor || 1) }}) تتجاوز المخزون ({{ item.availableStock }})
                  </p>
                } @else if (item.hasError) {
                  <p class="text-[10px] text-rose-600 font-bold">⚠ الكمية المتاحة: {{ item.maxAvailable }} فقط</p>
                }
              </div>
            }
          }
        </div>

        <!-- Cart Summary & Checkout -->
        <div class="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
          <!-- Discount -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-500 font-semibold whitespace-nowrap">خصم %</label>
              <input
                type="number"
                [ngModel]="cart.discountPercent()"
                (ngModelChange)="cart.setDiscount($event)"
                min="0" max="100"
                class="w-16 text-center text-xs font-bold border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span class="text-xs text-slate-400 flex-1 text-left font-semibold">
                - {{ cart.discountAmount() | number:'1.2-2' }} ج.م
              </span>
            </div>

            @if (cart.discountPercent() > 0) {
              <input
                type="text"
                [ngModel]="cart.discountReason()"
                (ngModelChange)="cart.setDiscountReason($event)"
                placeholder="سبب الخصم (اختياري)..."
                class="w-full text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            }

            @if (cart.discountPercent() > 10) {
              <div class="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center justify-between gap-2">
                <span class="font-bold">⚠️ يتطلب إذن المدير (>10%)</span>
                <label class="flex items-center gap-1 font-bold text-amber-900 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="isManagerApproved" class="rounded text-amber-600 focus:ring-0">
                  <span>موافقة المدير</span>
                </label>
              </div>
            }
          </div>

          <div class="space-y-1.5 text-xs text-slate-600 font-medium">
            <div class="flex justify-between">
              <span>المجموع:</span>
              <span class="font-bold text-slate-800">{{ cart.subtotal() | number:'1.2-2' }} ج.م</span>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span class="text-sm font-bold text-slate-800">الإجمالي النهائي:</span>
            <span class="text-2xl font-black text-emerald-600">{{ cart.grandTotal() | number:'1.2-2' }} <span class="text-xs font-semibold text-slate-500">ج.م</span></span>
          </div>

          <!-- Checkout Button -->
          <button
            (click)="openCheckoutModal()"
            [disabled]="cart.itemCount() === 0"
            class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>إتمام البيع والدفع (F1)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ██ CHECKOUT MODAL ██ -->
    @if (showCheckout()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="showCheckout.set(false)"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
          <h3 class="text-lg font-black text-slate-800 mb-4 text-center">💳 إتمام البيع</h3>

          <!-- Payment Method -->
          <div class="mb-4">
            <label class="text-xs text-slate-500 font-bold block mb-2">طريقة الدفع</label>
            <div class="grid grid-cols-4 gap-2">
              @for (method of paymentMethods; track method.value) {
                <button
                  (click)="cart.setPaymentMethod(method.value)"
                  class="py-2.5 rounded-xl text-xs font-bold transition-all"
                  [class]="cart.paymentMethod() === method.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                  {{ method.label }}
                </button>
              }
            </div>
          </div>

          <!-- Amount Paid -->
          @if (cart.paymentMethod() !== 'credit') {
            <div class="mb-4">
              <label class="text-xs text-slate-500 font-bold block mb-2">المبلغ المدفوع (ج.م)</label>
              <input
                type="number"
                [ngModel]="cart.amountPaid()"
                (ngModelChange)="cart.setAmountPaid($event)"
                class="w-full text-center text-2xl font-black border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                autofocus
              />
            </div>
          }

          <!-- Summary -->
          <div class="space-y-2 text-sm font-semibold bg-slate-50 rounded-xl p-4 mb-4">
            <div class="flex justify-between text-slate-600">
              <span>الإجمالي:</span>
              <span class="text-slate-800">{{ cart.grandTotal() | number:'1.2-2' }} ج.م</span>
            </div>
            @if (cart.paymentMethod() !== 'credit') {
              <div class="flex justify-between text-slate-600">
                <span>المدفوع:</span>
                <span>{{ cart.amountPaid() | number:'1.2-2' }} ج.م</span>
              </div>
              @if (cart.changeDue() > 0) {
                <div class="flex justify-between text-emerald-700 text-base font-black pt-2 border-t border-slate-200">
                  <span>الباقي للعميل:</span>
                  <span>{{ cart.changeDue() | number:'1.2-2' }} ج.م</span>
                </div>
              }
              @if (cart.remainingBalance() > 0 && cart.paymentMethod() !== 'partial') {
                <div class="flex justify-between text-rose-600 text-xs pt-1">
                  <span>⚠ المبلغ المدفوع أقل من الإجمالي</span>
                </div>
              }
            } @else {
              <div class="flex justify-between text-amber-700 text-xs pt-1">
                <span>⚠ سيتم تسجيل كامل المبلغ كدين على العميل</span>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              (click)="showCheckout.set(false)"
              class="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
              إلغاء
            </button>
            <button
              (click)="confirmSale()"
              [disabled]="isProcessingSale() || (cart.paymentMethod() !== 'credit' && cart.paymentMethod() !== 'partial' && cart.amountPaid() < cart.grandTotal())"
              class="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition-colors">
              @if (isProcessingSale()) {
                <span class="animate-pulse">جاري التسجيل...</span>
              } @else {
                تأكيد البيع ✓
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Item Details & Unit Selector Modal -->
    @if (selectedCartItem()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="selectedCartItem.set(null)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scale-in" (click)="$event.stopPropagation()">
          <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-white">تفاصيل الصنف والوحدات</h3>
              <p class="text-xs text-slate-300 mt-0.5">{{ selectedCartItem()!.nameAr }} ({{ selectedCartItem()!.barcode }})</p>
            </div>
            <button (click)="selectedCartItem.set(null)" class="text-slate-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            <!-- Financial & Stock Summary Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span class="text-[11px] font-bold text-amber-700 block">سعر الشراء (التكلفة)</span>
                <p class="text-base font-black text-amber-900 mt-0.5">
                  {{ (selectedCartItem()!.unitCostPrice || selectedCartItem()!.costPrice || 0) | number:'1.2-2' }}
                  <span class="text-[10px] font-normal text-amber-700">ج.م</span>
                </p>
                <span class="text-[10px] text-amber-600 block mt-0.5 font-medium">لكل {{ selectedCartItem()!.unitName || 'وحدة' }}</span>
              </div>

              <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <span class="text-[11px] font-bold text-emerald-700 block">سعر البيع الحالي</span>
                <p class="text-base font-black text-emerald-900 mt-0.5">
                  {{ selectedCartItem()!.sellingPrice | number:'1.2-2' }}
                  <span class="text-[10px] font-normal text-emerald-700">ج.م</span>
                </p>
                <span class="text-[10px] text-emerald-600 block mt-0.5 font-medium">لكل {{ selectedCartItem()!.unitName || 'وحدة' }}</span>
              </div>

              <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <span class="text-[11px] font-bold text-indigo-700 block">الربح للوحدة</span>
                <p class="text-base font-black text-indigo-900 mt-0.5">
                  {{ (selectedCartItem()!.sellingPrice - (selectedCartItem()!.unitCostPrice || selectedCartItem()!.costPrice || 0)) | number:'1.2-2' }}
                  <span class="text-[10px] font-normal text-indigo-700">ج.م</span>
                </p>
                <span class="text-[10px] text-indigo-600 block mt-0.5 font-bold">
                  {{ getItemProfitMargin(selectedCartItem()!) }}%
                </span>
              </div>

              <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span class="text-[11px] font-bold text-slate-600 block">المخزون المتاح</span>
                <p class="text-sm font-black text-slate-800 mt-0.5">
                  {{ selectedCartItem()!.stockDisplay || (selectedCartItem()!.availableStock + ' وحدة') }}
                </p>
                <span class="text-[10px] text-slate-500 block mt-0.5">إجمالي الرصيد</span>
              </div>
            </div>

            <!-- Unit Selection Section -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-black text-slate-700">اختر وحدة البيع المطلوبة:</label>
                <button (click)="showQuickAddUnit.set(!showQuickAddUnit())"
                  class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  <span>{{ showQuickAddUnit() ? 'إلغاء' : '+ إضافة وحدة جديدة (دستة/باكت/قطعة)' }}</span>
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                @for (u of (selectedCartItem()!.units || []); track u.id) {
                  <div
                    (click)="selectUnitInModal(u)"
                    class="p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between"
                    [class]="selectedCartItem()!.unitId === u.id
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        @if (selectedCartItem()!.unitId === u.id) {
                          <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                        }
                        {{ u.name }}
                      </span>
                      <span class="text-xs font-black text-emerald-700">{{ u.salePrice | number:'1.2-2' }} ج.م</span>
                    </div>
                    <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>معامل: {{ u.conversionFactor }} وحدة</span>
                      <span class="text-amber-700 font-semibold">تكلفة: {{ (selectedCartItem()!.costPrice * u.conversionFactor) | number:'1.2-2' }} ج.م</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Quick Add Unit Form inside Details Modal -->
            @if (showQuickAddUnit()) {
              <div class="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                <h5 class="text-xs font-bold text-indigo-900">إضافة وحدة جديدة للصنف فوراً</h5>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-0.5">اسم الوحدة</label>
                    <input type="text" [(ngModel)]="quickUnitName" placeholder="مثلاً: قطعة / باكت / دستة"
                      class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"/>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-0.5">معامل التحويل</label>
                    <input type="number" [(ngModel)]="quickUnitFactor" min="1" placeholder="مثلاً: 10"
                      class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"/>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-0.5">سعر البيع (ج.م)</label>
                    <input type="number" [(ngModel)]="quickUnitPrice" min="0" placeholder="مثلاً: 25.00"
                      class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"/>
                  </div>
                </div>
                <div class="flex justify-end gap-2 pt-1">
                  <button (click)="showQuickAddUnit.set(false)" class="px-3 py-1 text-xs text-slate-600 hover:text-slate-800">إلغاء</button>
                  <button (click)="saveQuickUnit()" [disabled]="savingQuickUnit()"
                    class="px-4 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50">
                    {{ savingQuickUnit() ? 'جاري الحفظ...' : 'حفظ واختيار الوحدة ✓' }}
                  </button>
                </div>
              </div>
            }

            <!-- Quantity Selector in Modal -->
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <label class="block text-xs font-bold text-slate-700">الكمية المطلوبة ({{ selectedCartItem()!.unitName || 'وحدة' }}):</label>
                <span class="text-[11px] text-slate-500 font-medium">
                  الإجمالي: {{ (selectedCartItem()!.sellingPrice * selectedCartItem()!.quantity) | number:'1.2-2' }} ج.م
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="cart.decreaseQty(selectedCartItem()!.productId)"
                  class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm shadow-xs">
                  -
                </button>
                <input
                  type="number"
                  [ngModel]="selectedCartItem()!.quantity"
                  (ngModelChange)="cart.updateQuantity(selectedCartItem()!.productId, $event)"
                  min="1"
                  class="w-14 h-8 text-center font-black text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button (click)="cart.increaseQty(selectedCartItem()!.productId)"
                  class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm shadow-xs">
                  +
                </button>
              </div>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button (click)="selectedCartItem.set(null)"
              class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all">
              تم ✓
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Clear Cart Confirm Dialog -->
    <app-confirm-dialog
      [isOpen]="showClearConfirm()"
      title="تفريغ السلة"
      message="هل أنت متأكد من تفريغ جميع الأصناف من السلة؟"
      confirmText="تفريغ"
      type="danger"
      (confirmed)="cart.clearCart(); showClearConfirm.set(false)"
      (cancelled)="showClearConfirm.set(false)">
    </app-confirm-dialog>
  `,
  styles: [`
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in { animation: scaleIn 0.2s ease-out; }
  `],
  host: {
    '(document:keydown.f1)': 'onF1($event)',
    '(document:keydown.f2)': 'onF2($event)',
    '(document:keydown.escape)': 'onEscape()',
  }
})
export class PosComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private productsService = inject(ProductsService);
  private invoicesService = inject(InvoicesService);
  private customersService = inject(CustomersService);
  private printService = inject(PrintService);
  private notification = inject(NotificationService);
  private apiService = inject(ApiService);
  cart = inject(CartStore);

  // ── State ──
  searchQuery = signal<string>('');
  customerSearchQuery = '';
  products = signal<ProductListDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  selectedCategory = signal<string | null>(null);
  filteredCustomers = signal<CustomerListDto[]>([]);
  isLoadingProducts = signal(false);
  hasProductsError = signal(false);
  showCheckout = signal(false);
  showClearConfirm = signal(false);
  isProcessingSale = signal(false);
  isManagerApproved = false;

  // Computed state for empty initial state (reacts whenever searchQuery or selectedCategory changes)
  isInitialState = computed(() => {
    return !this.selectedCategory() && this.searchQuery().trim().length < 2;
  });

  // Map of product ID -> total quantity in cart for fast lookup in row component
  cartQuantitiesMap = computed(() => {
    const map = new Map<string, number>();
    for (const item of this.cart.items()) {
      map.set(item.productId, (map.get(item.productId) || 0) + item.quantity);
    }
    return map;
  });

  // Item Details & Unit Selector Modal State
  selectedCartItem = signal<CartItem | null>(null);
  showQuickAddUnit = signal(false);
  savingQuickUnit = signal(false);
  quickUnitName = '';
  quickUnitFactor = 1;
  quickUnitPrice = 0;

  paymentMethods = [
    { value: 'cash' as const, label: 'كاش' },
    { value: 'card' as const, label: 'بطاقة' },
    { value: 'credit' as const, label: 'آجل' },
    { value: 'partial' as const, label: 'جزئي' },
  ];

  ngOnInit(): void {
    // Only load categories on init. Products start empty with initial state guide.
    this.loadCategories();

    // Check for saved draft
    if (this.cart.hasDraft() && this.cart.itemCount() > 0) {
      this.notification.info('تم استرجاع مسودة الفاتورة السابقة');
    }
  }

  // ── Product Loading ──

  loadProducts(): void {
    const query = this.searchQuery().trim();
    const categoryId = this.selectedCategory();

    // If initial state (no category and search text < 2 chars), reset products
    if (!categoryId && query.length < 2) {
      this.products.set([]);
      this.isLoadingProducts.set(false);
      this.hasProductsError.set(false);
      return;
    }

    this.isLoadingProducts.set(true);
    this.hasProductsError.set(false);

    const params: any = { page: 1, pageSize: 30 };
    if (query.length >= 2) params.search = query;
    if (categoryId) params.categoryId = categoryId;

    this.productsService.getAll(params).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.products.set(res.data.items || []);
        } else {
          this.products.set([]);
        }
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.hasProductsError.set(true);
        this.isLoadingProducts.set(false);
      }
    });
  }

  loadCategories(): void {
    this.apiService.get<any>('categories').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const items = res.data.items || res.data;
          this.categories.set(Array.isArray(items) ? items : []);
        }
      }
    });
  }

  // ── Search & Filter Controls ──

  private searchTimeout: any;
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    clearTimeout(this.searchTimeout);
    const trimmed = query.trim();
    if (!this.selectedCategory() && trimmed.length < 2) {
      this.products.set([]);
      this.isLoadingProducts.set(false);
      return;
    }
    this.isLoadingProducts.set(true);
    this.searchTimeout = setTimeout(() => this.loadProducts(), 300);
  }

  onCategoryChange(categoryId: string | null): void {
    this.selectedCategory.set(categoryId);
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.loadProducts();
    this.focusSearch();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set(null);
    this.loadProducts();
    this.focusSearch();
  }

  onSearchEnter(): void {
    const q = this.searchQuery().trim();
    if (!q) return;

    // Try exact barcode match first
    this.productsService.getByBarcode(q).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.cart.addProduct(res.data as any);
          this.notification.success(`تمت إضافة: ${res.data.nameAr}`);
          this.playBeep();
          this.searchQuery.set('');
          this.focusSearch();
        } else {
          this.handleBarcodeNotFound(q);
        }
      },
      error: () => {
        this.handleBarcodeNotFound(q);
      }
    });
  }

  private handleBarcodeNotFound(query: string): void {
    this.notification.warning('الصنف غير موجود');
    if (query.length >= 2) {
      this.loadProducts();
    }
  }

  // ── Barcode Scanner ──

  onBarcodeScanned(barcode: string): void {
    this.productsService.getByBarcode(barcode).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.cart.addProduct(res.data as any);
          this.notification.success(`🔊 ${res.data.nameAr}`);
          this.playBeep();
        } else {
          this.notification.warning('الصنف غير موجود');
        }
      },
      error: () => {
        this.notification.warning('الصنف غير موجود');
      }
    });
  }


  // ── Cart Actions ──

  getCartQuantity(productId: string): number {
    const item = this.cart.items().find(i => i.productId === productId);
    return item ? item.quantity : 0;
  }

  onProductAddToCart(event: AddToCartEvent): void {
    if (event.product.totalStock <= 0) return;
    this.cart.addProduct(event.product, event.unit);
  }

  addProductToCart(product: ProductListDto): void {
    if (product.totalStock <= 0) return;
    this.cart.addProduct(product);
  }

  // ── Customer Search ──

  searchCustomers(query: string): void {
    if (query.length < 2) {
      this.filteredCustomers.set([]);
      return;
    }
    this.customersService.getAll({ search: query, pageSize: 5 }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.filteredCustomers.set(res.data.items);
        }
      }
    });
  }

  selectCustomer(customer: CustomerListDto): void {
    this.cart.selectCustomer(customer);
    this.customerSearchQuery = '';
    this.filteredCustomers.set([]);
  }

  // ── Checkout ──

  openCheckoutModal(): void {
    if (this.cart.itemCount() === 0) return;
    this.cart.setAmountPaid(this.cart.grandTotal());
    this.showCheckout.set(true);
  }

  confirmSale(): void {
    this.isProcessingSale.set(true);

    const amountPaid = this.cart.paymentMethod() === 'credit'
      ? 0
      : this.cart.amountPaid();

    const request: CreateSaleRequest = {
      items: this.cart.items().map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitId: item.unitId,
      })),
      amountPaid,
      customerId: this.cart.selectedCustomer()?.id,
      discountPercent: this.cart.discountPercent(),
      discountReason: this.cart.discountReason(),
      isManagerApproved: this.isManagerApproved,
    };

    this.invoicesService.create(request).subscribe({
      next: res => {
        if (res.success) {
          this.notification.success('✅ تم تسجيل الفاتورة بنجاح!');
          this.isManagerApproved = false;

          // Fetch invoice detail for printing
          this.invoicesService.getById(res.data).subscribe({
            next: invoiceRes => {
              if (invoiceRes.success && invoiceRes.data) {
                this.printService.printReceipt(
                  invoiceRes.data,
                  amountPaid,
                  this.cart.selectedCustomer()?.name || 'عميل نقدي'
                );
              }
            }
          });

          this.showCheckout.set(false);
          this.cart.clearCart();
          this.loadProducts(); // Refresh stock counts
          this.focusSearch();
        }
        this.isProcessingSale.set(false);
      },
      error: (err) => {
        this.isProcessingSale.set(false);
        // Don't clear cart on error — keep items for user to fix
      }
    });
  }

  // ── Keyboard Shortcuts ──

  onF1(event: Event): void {
    event.preventDefault();
    this.openCheckoutModal();
  }

  onF2(event: Event): void {
    event.preventDefault();
    // Focus customer search
    const el = document.querySelector('input[placeholder*="F2"]') as HTMLInputElement;
    el?.focus();
  }

  onEscape(): void {
    this.showCheckout.set(false);
    this.showClearConfirm.set(false);
    this.focusSearch();
  }

  // ── Item Details & Unit Modal Actions ──

  openItemDetailsModal(item: CartItem): void {
    this.selectedCartItem.set(item);
    this.showQuickAddUnit.set(false);
    this.quickUnitName = '';
    this.quickUnitFactor = 1;
    this.quickUnitPrice = 0;
  }

  openAddUnitModal(item: CartItem): void {
    this.selectedCartItem.set(item);
    this.showQuickAddUnit.set(true);
    this.quickUnitName = '';
    this.quickUnitFactor = 1;
    this.quickUnitPrice = 0;
  }

  selectUnitInModal(unit: ProductUnitDto): void {
    const item = this.selectedCartItem();
    if (!item) return;
    this.cart.changeUnit(item.productId, unit);
    const updated = this.cart.items().find(i => i.productId === item.productId);
    if (updated) {
      this.selectedCartItem.set(updated);
    }
  }

  saveQuickUnit(): void {
    const item = this.selectedCartItem();
    if (!item) return;
    if (!this.quickUnitName.trim() || this.quickUnitFactor <= 0 || this.quickUnitPrice < 0) {
      this.notification.warning('يرجى إدخال اسم الوحدة ومعامل التحويل وسعر البيع بشكل صحيح');
      return;
    }

    this.savingQuickUnit.set(true);
    const body: CreateProductUnitRequest = {
      name: this.quickUnitName.trim(),
      conversionFactor: Number(this.quickUnitFactor),
      salePrice: Number(this.quickUnitPrice),
      isDefaultSale: false
    };

    this.productsService.addUnit(item.productId, body).subscribe({
      next: (res) => {
        this.savingQuickUnit.set(false);
        if (res.success && res.data) {
          const newUnit = res.data;
          this.notification.success(`تمت إضافة الوحدة "${newUnit.name}" بنجاح`);
          // Update product units in products list
          this.products.update(prods =>
            prods.map(p =>
              p.id === item.productId
                ? { ...p, units: [...(p.units || []), newUnit] }
                : p
            )
          );
          // Update units in cart
          const existingUnits = item.units || [];
          const updatedUnits = [...existingUnits, newUnit];
          this.cart.updateItemUnits(item.productId, updatedUnits);
          // Select this new unit!
          this.cart.changeUnit(item.productId, newUnit);
          const updated = this.cart.items().find(i => i.productId === item.productId);
          if (updated) {
            this.selectedCartItem.set(updated);
          }
          this.showQuickAddUnit.set(false);
        }
      },
      error: (err) => {
        this.savingQuickUnit.set(false);
        this.notification.error(err.error?.message || 'فشل إضافة الوحدة');
      }
    });
  }

  getItemProfitMargin(item: CartItem): string {
    const cost = item.unitCostPrice || item.costPrice || 0;
    if (cost <= 0) return '100';
    const profit = item.sellingPrice - cost;
    const margin = (profit / cost) * 100;
    return margin.toFixed(1);
  }

  // ── Helpers ──

  private focusSearch(): void {
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 100);
  }

  private playBeep(): void {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      oscillator.start();
      setTimeout(() => { oscillator.stop(); ctx.close(); }, 100);
    } catch { /* ignore audio errors */ }
  }
}

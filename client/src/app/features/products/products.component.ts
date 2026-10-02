import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { BrandsService } from '../../core/services/brands.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductListDto, CreateProductDto, UpdateProductDto, ProductDetailDto, ProductUnitDto, CreateProductUnitRequest, UpdateProductUnitRequest } from '../../core/models/product.model';
import { CategoryDto } from '../../core/models/category-brand.model';
import { BrandDto } from '../../core/models/category-brand.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800">المنتجات والمخزون</h2>
          <p class="text-sm text-slate-500 mt-1">إدارة الأصناف والتصنيفات والماركات</p>
        </div>
        <div class="flex gap-3">
          <button (click)="activeTab.set('categories')"
            [class]="activeTab() === 'categories' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            التصنيفات
          </button>
          <button (click)="activeTab.set('brands')"
            [class]="activeTab() === 'brands' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            الماركات
          </button>
          <button (click)="openCreateProduct()"
            class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            إضافة منتج
          </button>
        </div>
      </div>

      <!-- Inventory Health Summary Cards (Clickable Filters) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <!-- 1. All Products -->
        <button
          type="button"
          (click)="setStockFilter('all')"
          class="p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between"
          [class]="stockFilter() === 'all'
            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs text-slate-800'">
          <div>
            <span class="text-xs font-bold block" [class]="stockFilter() === 'all' ? 'text-slate-300' : 'text-slate-400'">إجمالي الأصناف</span>
            <span class="text-xl font-black font-mono mt-0.5 block">{{ globalTotalProducts() || totalCount() }}</span>
          </div>
          <span class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            [class]="stockFilter() === 'all' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'">📦</span>
        </button>

        <!-- 2. Stable In Stock -->
        <button
          type="button"
          (click)="setStockFilter('inStock')"
          class="p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between"
          [class]="stockFilter() === 'inStock'
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
            : 'bg-white hover:bg-emerald-50/40 border-slate-200 shadow-xs text-emerald-800'">
          <div>
            <span class="text-xs font-bold block" [class]="stockFilter() === 'inStock' ? 'text-emerald-100' : 'text-emerald-600'">متوفر ومستقر</span>
            <span class="text-xl font-black font-mono mt-0.5 block">{{ globalInStockCount() }}</span>
          </div>
          <span class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            [class]="stockFilter() === 'inStock' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'">✓</span>
        </button>

        <!-- 3. Critical Low Stock -->
        <button
          type="button"
          (click)="setStockFilter('lowStock')"
          class="p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between"
          [class]="stockFilter() === 'lowStock'
            ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-400/30'
            : 'bg-white hover:bg-amber-50/40 border-amber-200 bg-amber-50/10 shadow-xs text-amber-800'">
          <div>
            <span class="text-xs font-bold block" [class]="stockFilter() === 'lowStock' ? 'text-amber-100' : 'text-amber-700'">مخزون حرج (1 - 5)</span>
            <span class="text-xl font-black font-mono mt-0.5 block">{{ globalLowStockCount() }}</span>
          </div>
          <span class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            [class]="stockFilter() === 'lowStock' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'">⚠️</span>
        </button>

        <!-- 4. Out of Stock -->
        <button
          type="button"
          (click)="setStockFilter('outOfStock')"
          class="p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between"
          [class]="stockFilter() === 'outOfStock'
            ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
            : 'bg-white hover:bg-rose-50/40 border-rose-200 bg-rose-50/10 shadow-xs text-rose-800'">
          <div>
            <span class="text-xs font-bold block" [class]="stockFilter() === 'outOfStock' ? 'text-rose-100' : 'text-rose-700'">نفدت تماماً (نواقص)</span>
            <span class="text-xl font-black font-mono mt-0.5 block">{{ globalOutOfStockCount() }}</span>
          </div>
          <span class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            [class]="stockFilter() === 'outOfStock' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'">🛑</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div class="flex flex-col sm:flex-row gap-4 items-center">
          <div class="flex-1 relative w-full">
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="بحث بالاسم أو الباركود..."
              class="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none text-sm transition-all"/>
          </div>
          <select [(ngModel)]="filterCategory" (ngModelChange)="loadProducts()"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
            <option value="">كل التصنيفات</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.nameAr }}</option>
            }
          </select>
          <select [(ngModel)]="filterBrand" (ngModelChange)="loadProducts()"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
            <option value="">كل الماركات</option>
            @for (brand of brands(); track brand.id) {
              <option [value]="brand.id">{{ brand.nameAr }}</option>
            }
          </select>

          <!-- Toggle Low Stock Filter Button -->
          <button
            type="button"
            (click)="setStockFilter(stockFilter() === 'lowStock' ? 'all' : 'lowStock')"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
            [class]="stockFilter() === 'lowStock'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-400/30'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>{{ stockFilter() === 'lowStock' ? 'عرض كل الأصناف' : 'عرض النواقص فقط ⚠️' }}</span>
          </button>
        </div>
      </div>

      <!-- Categories/Brands mini-manager (shown as modal-like panel) -->
      @if (activeTab() === 'categories') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-800">إدارة التصنيفات</h3>
            <button (click)="activeTab.set('products')" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div class="flex gap-3 mb-4">
            <input type="text" [(ngModel)]="newCatName" placeholder="اسم التصنيف بالعربي"
              class="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
            <input type="text" [(ngModel)]="newCatNameEn" placeholder="English Name (optional)"
              class="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
            <button (click)="addCategory()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all">إضافة</button>
          </div>
          <div class="divide-y divide-slate-100">
            @for (cat of categories(); track cat.id) {
              <div class="flex items-center justify-between py-3 group">
                <div>
                  <span class="text-sm font-semibold text-slate-700">{{ cat.nameAr }}</span>
                  @if (cat.nameEn) {
                    <span class="text-xs text-slate-400 mr-2">({{ cat.nameEn }})</span>
                  }
                </div>
                <button (click)="deleteCategory(cat.id)" class="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            }
            @if (categories().length === 0) {
              <p class="text-center text-slate-400 py-8 text-sm">لا توجد تصنيفات بعد</p>
            }
          </div>
        </div>
      }

      @if (activeTab() === 'brands') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-800">إدارة الماركات</h3>
            <button (click)="activeTab.set('products')" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div class="flex gap-3 mb-4">
            <input type="text" [(ngModel)]="newBrandName" placeholder="اسم الماركة بالعربي"
              class="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
            <input type="text" [(ngModel)]="newBrandNameEn" placeholder="English Name (optional)"
              class="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
            <button (click)="addBrand()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all">إضافة</button>
          </div>
          <div class="divide-y divide-slate-100">
            @for (brand of brands(); track brand.id) {
              <div class="flex items-center justify-between py-3 group">
                <div>
                  <span class="text-sm font-semibold text-slate-700">{{ brand.nameAr }}</span>
                  @if (brand.nameEn) {
                    <span class="text-xs text-slate-400 mr-2">({{ brand.nameEn }})</span>
                  }
                </div>
                <button (click)="deleteBrand(brand.id)" class="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            }
            @if (brands().length === 0) {
              <p class="text-center text-slate-400 py-8 text-sm">لا توجد ماركات بعد</p>
            }
          </div>
        </div>
      }

      <!-- Products Table -->
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
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الباركود</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">اسم المنتج</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">التصنيف</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الماركة</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">سعر البيع</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">التكلفة</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">المخزون</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (product of displayedProducts(); track product.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5">
                      <span class="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{{ product.barcode }}</span>
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="text-sm font-semibold text-slate-800">{{ product.nameAr }}</span>
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{{ product.categoryNameAr }}</span>
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{{ product.brandNameAr }}</span>
                    </td>
                    <td class="px-5 py-3.5 text-sm font-bold text-emerald-700">{{ product.sellingPrice | number:'1.2-2' }} ج.م</td>
                    <td class="px-5 py-3.5 text-sm text-slate-500">{{ product.averageCost | number:'1.2-2' }} ج.م</td>
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          [class.bg-emerald-500]="product.totalStock > 20"
                          [class.bg-amber-500]="product.totalStock > 5 && product.totalStock <= 20"
                          [class.bg-rose-500]="product.totalStock > 0 && product.totalStock <= 5"
                          [class.bg-slate-400]="product.totalStock <= 0">
                        </span>
                        <span [class]="product.totalStock <= 0 ? 'text-slate-500 bg-slate-100 font-bold border border-slate-200' :
                                       product.totalStock <= 5 ? 'text-rose-700 bg-rose-50 font-bold border border-rose-200' :
                                       product.totalStock <= 20 ? 'text-amber-800 bg-amber-50 font-bold border border-amber-200' :
                                       'text-emerald-700 bg-emerald-50 font-semibold border border-emerald-100'"
                          class="text-xs px-2.5 py-1 rounded-full whitespace-nowrap">
                          {{ product.totalStock <= 0 ? 'نفدت الكمية (0)' : (product.stockDisplay || (product.totalStock + ' وحدة')) }}
                        </span>
                      </div>
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2">
                        <button (click)="openUnitsModal(product)"
                          title="إدارة وحدات البيع (علبة / شريط / قرص)"
                          class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </button>
                        <button (click)="openEditProduct(product)"
                          title="تعديل المنتج"
                          class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button (click)="confirmDeleteProduct(product)"
                          title="حذف المنتج"
                          class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (products().length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-16 text-slate-400 text-sm">
                      <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      لا توجد منتجات بعد — ابدأ بإضافة منتج جديد
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <span class="text-xs text-slate-500">عرض {{ products().length }} من {{ totalCount() }} منتج</span>
              <div class="flex gap-1">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1"
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  السابق
                </button>
                <span class="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg">{{ currentPage() }} / {{ totalPages() }}</span>
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  التالي
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Create/Edit Product Modal -->
      @if (showProductModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="showProductModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in" (click)="$event.stopPropagation()">
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex-shrink-0">
              <h3 class="text-lg font-bold text-white">{{ editingProduct() ? 'تعديل المنتج' : 'إضافة منتج جديد' }}</h3>
            </div>
            <div class="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5">الباركود *</label>
                <input type="text" [(ngModel)]="formBarcode" [disabled]="!!editingProduct()"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"/>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5">الاسم بالعربي *</label>
                  <input type="text" [(ngModel)]="formNameAr" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5">الاسم بالإنجليزي</label>
                  <input type="text" [(ngModel)]="formNameEn" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5">التصنيف *</label>
                  <select [(ngModel)]="formCategoryId" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                    <option value="">اختر التصنيف</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.nameAr }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5">الماركة *</label>
                  <select [(ngModel)]="formBrandId" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                    <option value="">اختر الماركة</option>
                    @for (brand of brands(); track brand.id) {
                      <option [value]="brand.id">{{ brand.nameAr }}</option>
                    }
                  </select>
                </div>
              </div>
              @if (!editingProduct()) {
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">سعر الشراء (التكلفة للعلبة) ج.م</label>
                    <input type="number" [(ngModel)]="formPurchasePrice" placeholder="مثلاً: 100.00" min="0" step="0.5"
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-bold text-slate-800"/>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">سعر بيع العلبة للجمهور * ج.م</label>
                    <input type="number" [(ngModel)]="formSellingPrice" (ngModelChange)="onBoxPriceChange()"
                      placeholder="مثلاً: 135.00" min="0" step="0.5"
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-black text-emerald-700"/>
                  </div>
                </div>

                @if (formPurchasePrice && formSellingPrice && formSellingPrice > formPurchasePrice) {
                  <div class="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
                    <span>الربح المتوقع للعلبة: <b>{{ (formSellingPrice - formPurchasePrice) | number:'1.2-2' }} ج.م</b></span>
                    <span class="font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      هامش ربح: {{ (((formSellingPrice - formPurchasePrice) / formPurchasePrice) * 100) | number:'1.1-1' }}%
                    </span>
                  </div>
                }

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">الرصيد الافتتاحي بالمخزن (عدد العلب)</label>
                    <input type="number" [(ngModel)]="formInitialStock" placeholder="الكمية المتوفرة حالياً" min="0"
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-bold text-slate-800"/>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الصلاحية (اختياري)</label>
                    <input type="date" [(ngModel)]="formExpiryDate"
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-bold text-slate-700"/>
                  </div>
                </div>

                <!-- Sub-units Breakdown Section -->
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-sm">💊</span>
                      <div>
                        <span class="text-xs font-bold text-slate-800 block">تجزئة البيع (أشرطة / أقراص)</span>
                        <span class="text-[11px] text-slate-400">تحديد أسعار الوحدات تلقائياً مع إمكانية التعديل</span>
                      </div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" [(ngModel)]="enableSubUnits" class="sr-only peer">
                      <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  @if (enableSubUnits) {
                    <div class="pt-2 border-t border-slate-200 space-y-3">
                      <!-- Strips Breakdown -->
                      <div class="grid grid-cols-2 gap-3 items-end bg-white p-3 rounded-xl border border-slate-100">
                        <div>
                          <label class="block text-[11px] font-bold text-slate-600 mb-1">عدد الشرائط بالعلبة</label>
                          <input type="number" [(ngModel)]="stripsPerBox" (ngModelChange)="onStripsCountChange()" min="1" placeholder="مثلاً: 2"
                            class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-bold"/>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <label class="text-[11px] font-bold text-slate-600">سعر بيع الشريط</label>
                            @if (stripPrice != null) {
                              <span class="text-[10px] text-emerald-600 font-bold">
                                {{ customStripPriceSet ? '(سعر مخصص)' : '(محسوب تلقائياً)' }}
                              </span>
                            }
                          </div>
                          <input type="number" [(ngModel)]="stripPrice" (input)="onStripPriceManualEdit()" min="0" placeholder="0.00"
                            class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-black text-emerald-700"/>
                        </div>
                      </div>

                      <!-- Tablets Breakdown -->
                      <div class="grid grid-cols-2 gap-3 items-end bg-white p-3 rounded-xl border border-slate-100">
                        <div>
                          <label class="block text-[11px] font-bold text-slate-600 mb-1">إجمالي الأقراص بالعلبة</label>
                          <input type="number" [(ngModel)]="tabletsPerBox" (ngModelChange)="onTabletsCountChange()" min="1" placeholder="مثلاً: 14"
                            class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-bold"/>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <label class="text-[11px] font-bold text-slate-600">سعر بيع القرص</label>
                            @if (tabletPrice != null) {
                              <span class="text-[10px] text-emerald-600 font-bold">
                                {{ customTabletPriceSet ? '(سعر مخصص)' : '(محسوب تلقائياً)' }}
                              </span>
                            }
                          </div>
                          <input type="number" [(ngModel)]="tabletPrice" (input)="onTabletPriceManualEdit()" min="0" placeholder="0.00"
                            class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-black text-emerald-700"/>
                        </div>
                      </div>

                      <!-- Summary Preview -->
                      <div class="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                        <span class="font-bold">الوحدات التي ستتاح للبيع:</span>
                        <span class="font-semibold text-[11px]">
                          علبة ({{ formSellingPrice | number:'1.2-2' }})
                          @if (stripsPerBox && stripPrice) {
                            + شريط ({{ stripPrice | number:'1.2-2' }})
                          }
                          @if (tabletsPerBox && tabletPrice) {
                            + قرص ({{ tabletPrice | number:'1.2-2' }})
                          }
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <button (click)="showProductModal.set(false)" class="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">إلغاء</button>
              <button (click)="saveProduct()" [disabled]="saving()"
                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all disabled:opacity-50">
                {{ saving() ? 'جاري الحفظ...' : (editingProduct() ? 'حفظ التعديلات' : 'إضافة المنتج') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Units Management Modal -->
      @if (showUnitsModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="showUnitsModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-scale-in" (click)="$event.stopPropagation()">
            <div class="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-white">إدارة وحدات البيع</h3>
                <p class="text-xs text-indigo-200 mt-0.5">{{ selectedProductForUnits()?.nameAr }}</p>
              </div>
              <button (click)="showUnitsModal.set(false)" class="text-white/70 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div class="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <!-- Add/Edit Unit Form -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 class="text-xs font-black text-slate-700 uppercase">{{ editingUnitId ? 'تعديل وحدة' : 'إضافة وحدة جديدة' }}</h4>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-500 mb-1">اسم الوحدة * (علبة، شريط، قرص)</label>
                    <input type="text" [(ngModel)]="unitFormName" placeholder="مثلاً: شريط"
                      class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"/>
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-500 mb-1">معامل التحويل * (كم وحدة أساسية)</label>
                    <input type="number" [(ngModel)]="unitFormFactor" min="1" placeholder="مثلاً: 10"
                      class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"/>
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-500 mb-1">سعر البيع * (ج.م)</label>
                    <input type="number" [(ngModel)]="unitFormPrice" min="0" placeholder="مثلاً: 25.00"
                      class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"/>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-500 mb-1">باركود خاص بهذه الوحدة (اختياري)</label>
                    <input type="text" [(ngModel)]="unitFormBarcode" placeholder="باركود الشريط إن وجد"
                      class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"/>
                  </div>
                  <div class="flex items-center gap-2 pt-4">
                    <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="checkbox" [(ngModel)]="unitFormIsDefault" class="rounded text-indigo-600 focus:ring-0"/>
                      <span>الوحدة الافتراضية في شاشة الكاشير</span>
                    </label>
                  </div>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                  @if (editingUnitId) {
                    <button (click)="resetUnitForm()" class="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800">إلغاء</button>
                  }
                  <button (click)="saveUnit()" [disabled]="savingUnit()"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-all disabled:opacity-50">
                    {{ savingUnit() ? 'جاري الحفظ...' : (editingUnitId ? 'حفظ التعديل' : 'إضافة الوحدة') }}
                  </button>
                </div>
              </div>

              <!-- Units Table -->
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-right">
                  <thead class="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 font-bold">
                    <tr>
                      <th class="p-3">اسم الوحدة</th>
                      <th class="p-3">معامل التحويل</th>
                      <th class="p-3">سعر البيع</th>
                      <th class="p-3">الباركود</th>
                      <th class="p-3">افتراضية</th>
                      <th class="p-3 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-xs">
                    @for (unit of productUnits(); track unit.id) {
                      <tr class="hover:bg-slate-50/50">
                        <td class="p-3 font-bold text-slate-800">{{ unit.name }}</td>
                        <td class="p-3 text-slate-600">{{ unit.conversionFactor }} قرص/وحدة</td>
                        <td class="p-3 font-black text-emerald-600">{{ unit.salePrice | number:'1.2-2' }} ج.م</td>
                        <td class="p-3 font-mono text-[11px] text-slate-500">{{ unit.barcode || '—' }}</td>
                        <td class="p-3">
                          @if (unit.isDefaultSale) {
                            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">نعم ✓</span>
                          } @else {
                            <span class="text-slate-400 text-[10px]">لا</span>
                          }
                        </td>
                        <td class="p-3 text-left">
                          <div class="flex items-center justify-end gap-1.5">
                            <button (click)="startEditUnit(unit)" class="p-1 text-slate-400 hover:text-indigo-600 rounded">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button (click)="deleteUnit(unit.id)" class="p-1 text-slate-400 hover:text-rose-600 rounded">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (productUnits().length === 0) {
                      <tr>
                        <td colspan="6" class="p-6 text-center text-slate-400 text-xs">لا توجد وحدات مخصصة — يعمل بالوحدة الافتراضية</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button (click)="showUnitsModal.set(false)" class="px-5 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all">إغلاق</button>
            </div>
          </div>
        </div>
      }

      <!-- Confirm Delete -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm()"
        title="حذف المنتج"
        [message]="'هل أنت متأكد من حذف المنتج: ' + (deletingProduct()?.nameAr || '') + '؟'"
        confirmText="حذف"
        mode="danger"
        (confirmed)="deleteProduct()"
        (cancelled)="showDeleteConfirm.set(false)">
      </app-confirm-dialog>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private brandsService = inject(BrandsService);
  private dashboardService = inject(DashboardService);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);

  products = signal<ProductListDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  brands = signal<BrandDto[]>([]);
  loading = signal(false);
  saving = signal(false);

  searchQuery = '';
  filterCategory = '';
  filterBrand = '';

  activeTab = signal<'products' | 'categories' | 'brands'>('products');
  newCatName = '';
  newCatNameEn = '';
  newBrandName = '';
  newBrandNameEn = '';

  // Pagination
  currentPage = signal(1);
  totalCount = signal(0);
  totalPages = signal(0);

  // Pharmacy-wide Inventory Health Metrics
  globalTotalProducts = signal(0);
  globalInStockCount = signal(0);
  globalLowStockCount = signal(0);
  globalOutOfStockCount = signal(0);

  // Active Stock Filter
  stockFilter = signal<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');

  // Product form
  showProductModal = signal(false);
  editingProduct = signal<ProductListDto | null>(null);
  formBarcode = '';
  formNameAr = '';
  formNameEn = '';
  formCategoryId = '';
  formBrandId = '';
  formSellingPrice = 0;
  formPurchasePrice: number | null = null;
  formInitialStock: number | null = null;
  formExpiryDate = '';

  displayedProducts = computed(() => this.products());

  setStockFilter(mode: 'all' | 'inStock' | 'lowStock' | 'outOfStock') {
    if (this.stockFilter() === mode && mode !== 'all') {
      this.stockFilter.set('all');
    } else {
      this.stockFilter.set(mode);
    }
    this.currentPage.set(1);
    this.loadProducts();
  }

  // Delete
  showDeleteConfirm = signal(false);
  deletingProduct = signal<ProductListDto | null>(null);

  // Units management
  showUnitsModal = signal(false);
  selectedProductForUnits = signal<ProductListDto | null>(null);
  productUnits = signal<ProductUnitDto[]>([]);
  editingUnitId: string | null = null;
  unitFormName = '';
  unitFormFactor = 1;
  unitFormPrice = 0;
  unitFormBarcode = '';
  unitFormIsDefault = false;
  savingUnit = signal(false);

  // Sub-units breakdown state during product creation
  enableSubUnits = false;
  stripsPerBox: number | null = null;
  tabletsPerBox: number | null = null;
  stripPrice: number | null = null;
  tabletPrice: number | null = null;
  customStripPriceSet = false;
  customTabletPriceSet = false;

  private searchTimeout: any;

  ngOnInit() {
    this.loadCategories();
    this.loadBrands();
    this.loadInventoryStats();

    this.route.queryParams.subscribe(params => {
      const f = params['filter'];
      if (f === 'lowStock' || f === 'outOfStock' || f === 'inStock') {
        this.stockFilter.set(f);
      } else {
        this.stockFilter.set('all');
      }
      this.currentPage.set(1);
      this.loadProducts();
    });
  }

  loadInventoryStats() {
    this.dashboardService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.globalTotalProducts.set(res.data.totalProductsCount);
          this.globalLowStockCount.set(res.data.lowStockProductsCount);
          this.globalOutOfStockCount.set(res.data.outOfStockProductsCount);
          this.globalInStockCount.set(
            Math.max(0, res.data.totalProductsCount - res.data.lowStockProductsCount - res.data.outOfStockProductsCount)
          );
        }
      }
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadProducts();
    }, 400);
  }

  loadProducts() {
    this.loading.set(true);
    const filter = this.stockFilter();
    this.productsService.getAll({
      page: this.currentPage(),
      pageSize: 15,
      search: this.searchQuery || undefined,
      categoryId: this.filterCategory || undefined,
      brandId: this.filterBrand || undefined,
      stockStatus: filter !== 'all' ? filter : undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.products.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
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

  addCategory() {
    if (!this.newCatName.trim()) return;
    this.categoriesService.create({ nameAr: this.newCatName, nameEn: this.newCatNameEn || undefined }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('تم إضافة التصنيف بنجاح');
          this.newCatName = '';
          this.newCatNameEn = '';
          this.loadCategories();
        }
      }
    });
  }

  deleteCategory(id: string) {
    this.categoriesService.delete(id).subscribe({
      next: () => { this.notify.success('تم حذف التصنيف'); this.loadCategories(); }
    });
  }

  addBrand() {
    if (!this.newBrandName.trim()) return;
    this.brandsService.create({ nameAr: this.newBrandName, nameEn: this.newBrandNameEn || undefined }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('تم إضافة الماركة بنجاح');
          this.newBrandName = '';
          this.newBrandNameEn = '';
          this.loadBrands();
        }
      }
    });
  }

  deleteBrand(id: string) {
    this.brandsService.delete(id).subscribe({
      next: () => { this.notify.success('تم حذف الماركة'); this.loadBrands(); }
    });
  }

  onBoxPriceChange() {
    if (!this.customStripPriceSet && this.stripsPerBox && this.stripsPerBox > 0) {
      this.stripPrice = Math.round((this.formSellingPrice / this.stripsPerBox) * 100) / 100;
    }
    if (!this.customTabletPriceSet && this.tabletsPerBox && this.tabletsPerBox > 0) {
      this.tabletPrice = Math.round((this.formSellingPrice / this.tabletsPerBox) * 100) / 100;
    }
  }

  onStripsCountChange() {
    if (this.stripsPerBox && this.stripsPerBox > 0) {
      this.stripPrice = Math.round((this.formSellingPrice / this.stripsPerBox) * 100) / 100;
      this.customStripPriceSet = false;
    } else {
      this.stripPrice = null;
    }
  }

  onTabletsCountChange() {
    if (this.tabletsPerBox && this.tabletsPerBox > 0) {
      this.tabletPrice = Math.round((this.formSellingPrice / this.tabletsPerBox) * 100) / 100;
      this.customTabletPriceSet = false;
    } else {
      this.tabletPrice = null;
    }
  }

  onStripPriceManualEdit() {
    this.customStripPriceSet = true;
  }

  onTabletPriceManualEdit() {
    this.customTabletPriceSet = true;
  }

  openCreateProduct() {
    this.editingProduct.set(null);
    this.formBarcode = '';
    this.formNameAr = '';
    this.formNameEn = '';
    this.formCategoryId = '';
    this.formBrandId = '';
    this.formSellingPrice = 0;
    this.formPurchasePrice = null;
    this.formInitialStock = null;
    this.formExpiryDate = '';
    this.enableSubUnits = false;
    this.stripsPerBox = null;
    this.tabletsPerBox = null;
    this.stripPrice = null;
    this.tabletPrice = null;
    this.customStripPriceSet = false;
    this.customTabletPriceSet = false;
    this.showProductModal.set(true);
  }

  openEditProduct(product: ProductListDto) {
    this.editingProduct.set(product);
    this.formBarcode = product.barcode;
    this.formNameAr = product.nameAr;
    this.formNameEn = product.nameEn || '';
    // Need to find category/brand IDs - we'll use the detail endpoint
    this.productsService.getById(product.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.formCategoryId = res.data.categoryId;
          this.formBrandId = res.data.brandId;
        }
      }
    });
    this.showProductModal.set(true);
  }

  saveProduct() {
    if (!this.formNameAr.trim() || !this.formCategoryId || !this.formBrandId) {
      this.notify.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    this.saving.set(true);

    if (this.editingProduct()) {
      const dto: UpdateProductDto = {
        nameAr: this.formNameAr,
        nameEn: this.formNameEn || undefined,
        categoryId: this.formCategoryId,
        brandId: this.formBrandId
      };
      this.productsService.update(this.editingProduct()!.id, dto).subscribe({
        next: () => {
          this.notify.success('تم تعديل المنتج بنجاح');
          this.showProductModal.set(false);
          this.saving.set(false);
          this.loadProducts();
          this.loadInventoryStats();
        },
        error: () => this.saving.set(false)
      });
    } else {
      if (!this.formBarcode.trim() || !this.formSellingPrice) {
        this.notify.error('يرجى ملء الباركود وسعر البيع');
        this.saving.set(false);
        return;
      }

      const units: CreateProductUnitRequest[] = [];

      if (this.enableSubUnits && (this.tabletsPerBox || this.stripsPerBox)) {
        // If tablets are defined, tablets are the base unit (factor 1)
        if (this.tabletsPerBox && this.tabletsPerBox > 0) {
          const totalTablets = Number(this.tabletsPerBox);
          const boxPrice = Number(this.formSellingPrice);
          const tabletSalePrice = this.tabletPrice != null ? Number(this.tabletPrice) : Math.round((boxPrice / totalTablets) * 100) / 100;

          // 1. Box Unit
          units.push({
            name: 'علبة',
            conversionFactor: totalTablets,
            salePrice: boxPrice,
            barcode: this.formBarcode,
            isDefaultSale: true
          });

          // 2. Strip Unit (if strips defined)
          if (this.stripsPerBox && this.stripsPerBox > 0) {
            const numStrips = Number(this.stripsPerBox);
            const tabletsPerStrip = Math.max(1, Math.round(totalTablets / numStrips));
            const stripSalePrice = this.stripPrice != null ? Number(this.stripPrice) : Math.round((boxPrice / numStrips) * 100) / 100;
            units.push({
              name: 'شريط',
              conversionFactor: tabletsPerStrip,
              salePrice: stripSalePrice,
              isDefaultSale: false
            });
          }

          // 3. Tablet Unit
          units.push({
            name: 'قرص',
            conversionFactor: 1,
            salePrice: tabletSalePrice,
            isDefaultSale: false
          });
        }
        else if (this.stripsPerBox && this.stripsPerBox > 0) {
          // Only strips
          const numStrips = Number(this.stripsPerBox);
          const boxPrice = Number(this.formSellingPrice);
          const stripSalePrice = this.stripPrice != null ? Number(this.stripPrice) : Math.round((boxPrice / numStrips) * 100) / 100;

          units.push({
            name: 'علبة',
            conversionFactor: numStrips,
            salePrice: boxPrice,
            barcode: this.formBarcode,
            isDefaultSale: true
          });

          units.push({
            name: 'شريط',
            conversionFactor: 1,
            salePrice: stripSalePrice,
            isDefaultSale: false
          });
        }
      } else {
        // Simple default box unit
        units.push({
          name: 'علبة',
          conversionFactor: 1,
          salePrice: Number(this.formSellingPrice),
          barcode: this.formBarcode,
          isDefaultSale: true
        });
      }

      const dto: CreateProductDto = {
        barcode: this.formBarcode,
        nameAr: this.formNameAr,
        nameEn: this.formNameEn || undefined,
        categoryId: this.formCategoryId,
        brandId: this.formBrandId,
        sellingPrice: Number(this.formSellingPrice),
        purchasePrice: this.formPurchasePrice ? Number(this.formPurchasePrice) : undefined,
        initialStock: this.formInitialStock ? Number(this.formInitialStock) : undefined,
        expiryDate: this.formExpiryDate || undefined,
        units: units.length > 0 ? units : undefined
      };
      this.productsService.create(dto).subscribe({
        next: () => {
          this.notify.success('تم إضافة المنتج ووحدات البيع بنجاح');
          this.showProductModal.set(false);
          this.saving.set(false);
          this.loadProducts();
          this.loadInventoryStats();
        },
        error: () => this.saving.set(false)
      });
    }
  }

  confirmDeleteProduct(product: ProductListDto) {
    this.deletingProduct.set(product);
    this.showDeleteConfirm.set(true);
  }

  deleteProduct() {
    const product = this.deletingProduct();
    if (!product) return;
    this.productsService.delete(product.id).subscribe({
      next: () => {
        this.notify.success('تم حذف المنتج');
        this.showDeleteConfirm.set(false);
        this.loadProducts();
        this.loadInventoryStats();
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
  }

  // ── Units Management Methods ──

  openUnitsModal(product: ProductListDto) {
    this.selectedProductForUnits.set(product);
    this.resetUnitForm();
    this.loadProductUnits(product.id);
    this.showUnitsModal.set(true);
  }

  loadProductUnits(productId: string) {
    this.productsService.getById(productId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.productUnits.set(res.data.units || []);
        }
      }
    });
  }

  startEditUnit(unit: ProductUnitDto) {
    this.editingUnitId = unit.id;
    this.unitFormName = unit.name;
    this.unitFormFactor = unit.conversionFactor;
    this.unitFormPrice = unit.salePrice;
    this.unitFormBarcode = unit.barcode || '';
    this.unitFormIsDefault = unit.isDefaultSale;
  }

  resetUnitForm() {
    this.editingUnitId = null;
    this.unitFormName = '';
    this.unitFormFactor = 1;
    this.unitFormPrice = 0;
    this.unitFormBarcode = '';
    this.unitFormIsDefault = false;
  }

  saveUnit() {
    const product = this.selectedProductForUnits();
    if (!product) return;

    if (!this.unitFormName.trim() || this.unitFormFactor <= 0 || this.unitFormPrice < 0) {
      this.notify.error('يرجى التأكد من ملء اسم الوحدة ومعامل التحويل والسعر بشكل صحيح');
      return;
    }

    this.savingUnit.set(true);

    if (this.editingUnitId) {
      const req: UpdateProductUnitRequest = {
        name: this.unitFormName.trim(),
        conversionFactor: Number(this.unitFormFactor),
        salePrice: Number(this.unitFormPrice),
        barcode: this.unitFormBarcode.trim() || undefined,
        isDefaultSale: this.unitFormIsDefault
      };

      this.productsService.updateUnit(product.id, this.editingUnitId, req).subscribe({
        next: (res) => {
          if (res.success) {
            this.notify.success('تم تعديل الوحدة بنجاح');
            this.resetUnitForm();
            this.loadProductUnits(product.id);
            this.loadProducts();
          }
          this.savingUnit.set(false);
        },
        error: () => this.savingUnit.set(false)
      });
    } else {
      const req: CreateProductUnitRequest = {
        name: this.unitFormName.trim(),
        conversionFactor: Number(this.unitFormFactor),
        salePrice: Number(this.unitFormPrice),
        barcode: this.unitFormBarcode.trim() || undefined,
        isDefaultSale: this.unitFormIsDefault
      };

      this.productsService.addUnit(product.id, req).subscribe({
        next: (res) => {
          if (res.success) {
            this.notify.success('تمت إضافة الوحدة بنجاح');
            this.resetUnitForm();
            this.loadProductUnits(product.id);
            this.loadProducts();
          }
          this.savingUnit.set(false);
        },
        error: () => this.savingUnit.set(false)
      });
    }
  }

  deleteUnit(unitId: string) {
    const product = this.selectedProductForUnits();
    if (!product) return;

    this.productsService.deleteUnit(product.id, unitId).subscribe({
      next: () => {
        this.notify.success('تم حذف الوحدة');
        this.loadProductUnits(product.id);
        this.loadProducts();
      }
    });
  }
}

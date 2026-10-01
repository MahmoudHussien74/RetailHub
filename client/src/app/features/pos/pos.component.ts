import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { InvoicesService } from '../../core/services/invoices.service';
import { CustomersService } from '../../core/services/customers.service';
import { PrintService } from '../../core/services/print.service';
import { NotificationService } from '../../core/services/notification.service';
import { CartStore } from '../../core/stores/cart.store';
import { ProductListDto } from '../../core/models/product.model';
import { CustomerListDto } from '../../core/models/customer.model';
import { CreateSaleRequest } from '../../core/models/invoice.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BarcodeListenerDirective } from '../../shared/directives/barcode-listener.directive';
import { CategoryDto, BrandDto } from '../../core/models/category-brand.model';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, BarcodeListenerDirective],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col lg:flex-row gap-5"
      appBarcodeListener
      (barcodeScanned)="onBarcodeScanned($event)">

      <!-- ██ LEFT PANEL: Products & Search ██ -->
      <div class="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <!-- Search & Category Filters -->
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
          <div class="relative flex-1">
            <input
              #searchInput
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              (keydown.enter)="onSearchEnter()"
              placeholder="امسح الباركود أو ابحث عن المنتج بالاسم..."
              class="barcode-search w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              autofocus
            />
            <svg class="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <div class="flex gap-2 flex-wrap">
            <button
              (click)="selectedCategory.set(null); loadProducts()"
              class="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              [class]="selectedCategory() === null
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'">
              جميع الأصناف
            </button>
            @for (cat of categories(); track cat.id) {
              <button
                (click)="selectedCategory.set(cat.id); loadProducts()"
                class="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                [class]="selectedCategory() === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'">
                {{ cat.nameAr }}
              </button>
            }
          </div>
        </div>

        <!-- Products Grid -->
        <div class="flex-1 overflow-y-auto p-4">
          @if (isLoadingProducts()) {
            <!-- Skeleton Loader -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="p-3.5 rounded-xl border border-slate-200 bg-white animate-pulse">
                  <div class="h-3 bg-slate-200 rounded w-20 mb-2"></div>
                  <div class="h-4 bg-slate-200 rounded w-full mb-1"></div>
                  <div class="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div class="flex justify-between pt-2 border-t border-slate-100">
                    <div class="h-3 bg-slate-200 rounded w-14"></div>
                    <div class="h-4 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (products().length === 0) {
            <!-- Empty State -->
            <div class="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <svg class="w-16 h-16 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              <p class="text-sm font-bold text-slate-500">لا توجد منتجات</p>
              <p class="text-xs text-slate-400 mt-1">حاول تغيير البحث أو التصنيف</p>
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              @for (prod of products(); track prod.id) {
                <button
                  (click)="addProductToCart(prod)"
                  [disabled]="prod.totalStock <= 0"
                  class="flex flex-col justify-between p-3.5 rounded-xl border transition-all text-right group"
                  [class]="prod.totalStock <= 0
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 hover:border-emerald-500 hover:shadow-md bg-white hover:bg-emerald-50/30'">
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 font-mono">{{ prod.barcode }}</span>
                    <h4 class="font-bold text-sm text-slate-800 line-clamp-2 mt-0.5 group-hover:text-emerald-700">{{ prod.nameAr }}</h4>
                  </div>
                  <div class="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span class="text-xs font-semibold"
                      [class]="prod.totalStock <= 3 ? 'text-rose-500' : 'text-slate-400'">
                      متبقي: {{ prod.totalStock }}
                    </span>
                    <span class="font-black text-sm text-emerald-600">{{ prod.sellingPrice | number:'1.2-2' }} ج.م</span>
                  </div>
                </button>
              }
            </div>
          }
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
              <div class="flex items-center justify-between p-2.5 rounded-xl border"
                [class]="item.hasError ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'">
                <div class="flex-1 min-w-0 pr-1">
                  <h5 class="text-xs font-bold text-slate-800 truncate">{{ item.nameAr }}</h5>
                  <span class="text-[11px] font-semibold"
                    [class]="item.hasError ? 'text-rose-500' : 'text-slate-400'">
                    {{ item.sellingPrice | number:'1.2-2' }} × {{ item.quantity }} = {{ (item.sellingPrice * item.quantity) | number:'1.2-2' }} ج.م
                  </span>
                  @if (item.hasError) {
                    <p class="text-[10px] text-rose-600 font-bold mt-0.5">⚠ الكمية المتاحة: {{ item.maxAvailable }} فقط</p>
                  }
                </div>

                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <button (click)="cart.decreaseQty(item.productId)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center text-xs">
                    -
                  </button>
                  <span class="w-7 text-center font-bold text-xs text-slate-800">{{ item.quantity }}</span>
                  <button (click)="cart.increaseQty(item.productId)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center text-xs">
                    +
                  </button>
                  <button (click)="cart.removeItem(item.productId)" class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 flex items-center justify-center text-xs mr-1">
                    ✕
                  </button>
                </div>
              </div>
            }
          }
        </div>

        <!-- Cart Summary & Checkout -->
        <div class="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
          <!-- Discount -->
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
  searchQuery = '';
  customerSearchQuery = '';
  products = signal<ProductListDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  selectedCategory = signal<string | null>(null);
  filteredCustomers = signal<CustomerListDto[]>([]);
  isLoadingProducts = signal(true);
  showCheckout = signal(false);
  showClearConfirm = signal(false);
  isProcessingSale = signal(false);

  paymentMethods = [
    { value: 'cash' as const, label: 'كاش' },
    { value: 'card' as const, label: 'بطاقة' },
    { value: 'credit' as const, label: 'آجل' },
    { value: 'partial' as const, label: 'جزئي' },
  ];

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();

    // Check for saved draft
    if (this.cart.hasDraft() && this.cart.itemCount() > 0) {
      this.notification.info('تم استرجاع مسودة الفاتورة السابقة');
    }
  }

  // ── Product Loading ──

  loadProducts(): void {
    this.isLoadingProducts.set(true);
    const params: any = { page: 1, pageSize: 50 };
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    if (this.selectedCategory()) params.categoryId = this.selectedCategory();

    this.productsService.getAll(params).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.products.set(res.data.items);
        }
        this.isLoadingProducts.set(false);
      },
      error: () => this.isLoadingProducts.set(false)
    });
  }

  loadCategories(): void {
    this.apiService.get<any>('categories').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          // If paginated
          const items = res.data.items || res.data;
          this.categories.set(Array.isArray(items) ? items : []);
        }
      }
    });
  }

  // ── Search ──

  private searchTimeout: any;
  onSearchChange(query: string): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadProducts(), 300);
  }

  onSearchEnter(): void {
    const q = this.searchQuery.trim();
    if (!q) return;

    // Try barcode first (numeric or short string)
    this.productsService.getByBarcode(q).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.cart.addProduct(res.data as any);
          this.notification.success(`تمت إضافة: ${res.data.nameAr}`);
          this.searchQuery = '';
          this.focusSearch();
        }
      },
      error: () => {
        // Not a barcode — load as search
        this.loadProducts();
      }
    });
  }

  // ── Barcode Scanner ──

  onBarcodeScanned(barcode: string): void {
    this.productsService.getByBarcode(barcode).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.cart.addProduct(res.data as any);
          this.notification.success(`🔊 ${res.data.nameAr}`);
          // Play beep sound
          this.playBeep();
        }
      },
      error: () => {
        this.notification.warning(`لم يتم العثور على منتج بالباركود: ${barcode}`);
      }
    });
  }

  // ── Cart Actions ──

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
      })),
      amountPaid,
      customerId: this.cart.selectedCustomer()?.id,
    };

    this.invoicesService.create(request).subscribe({
      next: res => {
        if (res.success) {
          this.notification.success('✅ تم تسجيل الفاتورة بنجاح!');

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

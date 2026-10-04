import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockAdjustmentsService } from '../../core/services/stock-adjustments.service';
import { ProductsService } from '../../core/services/products.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductListDto, ProductUnitDto } from '../../core/models/product.model';
import {
  BatchOptionDto,
  StockAdjustmentDto,
  StockAdjustmentSummaryDto
} from '../../core/models/stock-adjustment.model';

type AdjustMode = 'writeOff' | 'count';

const WRITE_OFF_REASONS = ['تالف / كسر', 'منتهي الصلاحية', 'فقد / سرقة', 'تلف بسبب التخزين', 'أخرى'];
const COUNT_REASONS = ['جرد دوري', 'عجز جرد', 'زيادة جرد', 'تصحيح خطأ إدخال', 'أخرى'];

@Component({
  selector: 'app-stock-adjustments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800">تسوية المخزون والتوالف</h1>
          <p class="text-sm text-slate-500 mt-1">إعدام الأصناف التالفة والمنتهية وتسوية الجرد الفعلي مع تسجيل السبب</p>
        </div>
        <div class="flex gap-3">
          <button id="btn-count" (click)="openModal('count')"
            class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-5 py-2 rounded-xl text-sm transition-all">
            📋 جرد وتسوية
          </button>
          <button id="btn-write-off" (click)="openModal('writeOff')"
            class="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-rose-600/20 transition-all text-sm">
            🗑️ تسجيل تالف / إعدام
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-2xl border border-rose-200 bg-rose-50/40">
          <span class="text-xs font-bold text-rose-700 block">إجمالي الخسائر (بسعر التكلفة)</span>
          <span class="text-xl font-black font-mono text-rose-700 mt-1 block">{{ summary().totalLoss | number:'1.2-2' }} ج.م</span>
        </div>
        <div class="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
          <span class="text-xs font-bold text-emerald-700 block">إجمالي الزيادات (جرد)</span>
          <span class="text-xl font-black font-mono text-emerald-700 mt-1 block">{{ summary().totalSurplus | number:'1.2-2' }} ج.م</span>
        </div>
        <div class="p-4 rounded-2xl border border-slate-200 bg-white">
          <span class="text-xs font-bold text-slate-500 block">عمليات الإعدام</span>
          <span class="text-xl font-black font-mono text-slate-800 mt-1 block">{{ summary().writeOffCount }}</span>
        </div>
        <div class="p-4 rounded-2xl border border-slate-200 bg-white">
          <span class="text-xs font-bold text-slate-500 block">عمليات التسوية</span>
          <span class="text-xl font-black font-mono text-slate-800 mt-1 block">{{ summary().adjustmentCount }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-[11px] font-bold text-slate-500 mb-1">من تاريخ</label>
          <input id="filter-from" type="date" [(ngModel)]="fromDate" (ngModelChange)="onFilterChange()"
            class="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-500 mb-1">إلى تاريخ</label>
          <input id="filter-to" type="date" [(ngModel)]="toDate" (ngModelChange)="onFilterChange()"
            class="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
        </div>
        @if (fromDate || toDate) {
          <button (click)="clearFilters()" class="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800">مسح الفلاتر</button>
        }
      </div>

      <!-- History -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                  <th class="px-5 py-3.5">التاريخ</th>
                  <th class="px-5 py-3.5">الصنف</th>
                  <th class="px-5 py-3.5">النوع</th>
                  <th class="px-5 py-3.5">الكمية (وحدة أساسية)</th>
                  <th class="px-5 py-3.5">الصلاحية</th>
                  <th class="px-5 py-3.5">الأثر المالي</th>
                  <th class="px-5 py-3.5">السبب</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                @for (row of rows(); track row.id) {
                  <tr class="hover:bg-slate-50/70">
                    <td class="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{{ row.movementDate | date:'yyyy/MM/dd HH:mm' }}</td>
                    <td class="px-5 py-3">
                      <span class="font-semibold text-slate-800 block">{{ row.productNameAr }}</span>
                      <span class="text-[11px] font-mono text-slate-400">{{ row.barcode }}</span>
                    </td>
                    <td class="px-5 py-3">
                      @if (row.type === 'Damage') {
                        <span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">إعدام / تالف</span>
                      } @else {
                        <span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">تسوية جرد</span>
                      }
                    </td>
                    <td class="px-5 py-3 font-mono font-bold"
                      [class.text-rose-600]="isDecrease(row)" [class.text-emerald-600]="!isDecrease(row)">
                      {{ isDecrease(row) ? '-' : '+' }}{{ absQty(row) }}
                    </td>
                    <td class="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{{ row.batchExpiryDate | date:'yyyy/MM/dd' }}</td>
                    <td class="px-5 py-3 font-black font-mono"
                      [class.text-rose-600]="row.valueImpact < 0" [class.text-emerald-600]="row.valueImpact > 0">
                      {{ row.valueImpact | number:'1.2-2' }} ج.م
                    </td>
                    <td class="px-5 py-3 text-xs text-slate-600 max-w-[220px]">{{ row.notes || '—' }}</td>
                  </tr>
                }
                @if (rows().length === 0) {
                  <tr>
                    <td colspan="7" class="text-center py-16 text-slate-400 text-sm">لا توجد عمليات تسوية أو إعدام مسجلة</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <span class="text-xs text-slate-500">عرض {{ rows().length }} من {{ totalCount() }} عملية</span>
              <div class="flex gap-1">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1"
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">السابق</button>
                <span class="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg">{{ currentPage() }} / {{ totalPages() }}</span>
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">التالي</button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Adjust modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="closeModal()">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="px-6 py-5 flex-shrink-0"
              [class]="mode() === 'writeOff' ? 'bg-gradient-to-r from-rose-900 to-rose-800' : 'bg-gradient-to-r from-indigo-900 to-indigo-800'">
              <h3 class="text-lg font-bold text-white">{{ mode() === 'writeOff' ? 'تسجيل تالف / إعدام أصناف' : 'جرد وتسوية المخزون' }}</h3>
              <p class="text-xs text-white/70 mt-0.5">
                {{ mode() === 'writeOff' ? 'تُخصم الكمية من المخزن وتُسجل كخسارة بسعر التكلفة' : 'أدخل الكمية الفعلية الموجودة على الرف وسيتم ضبط الرصيد تلقائياً' }}
              </p>
            </div>

            <div class="p-6 space-y-4 overflow-y-auto flex-1">
              <!-- Product search -->
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1.5">الصنف *</label>
                @if (!selectedProduct()) {
                  <input id="adjust-product-search" type="text" [(ngModel)]="productSearch" (ngModelChange)="onProductSearch()"
                    placeholder="ابحث بالاسم أو الباركود..."
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                  @if (productResults().length > 0) {
                    <div class="mt-2 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      @for (p of productResults(); track p.id) {
                        <button type="button" (click)="selectProduct(p)"
                          class="w-full text-right px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between">
                          <span class="text-sm font-semibold text-slate-800">{{ p.nameAr }}</span>
                          <span class="text-[11px] font-mono text-slate-400">{{ p.barcode }}</span>
                        </button>
                      }
                    </div>
                  }
                } @else {
                  <div class="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span class="text-sm font-bold text-emerald-900">{{ selectedProduct()!.nameAr }}</span>
                    <button type="button" (click)="clearProduct()" class="text-xs font-bold text-emerald-700 hover:text-emerald-900">تغيير</button>
                  </div>
                }
              </div>

              @if (selectedProduct()) {
                <!-- Batch -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">التشغيلة (حسب تاريخ الصلاحية) *</label>
                  @if (batches().length === 0) {
                    <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">لا توجد تشغيلات بها رصيد لهذا الصنف</p>
                  } @else {
                    <select id="adjust-batch" [(ngModel)]="batchId"
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30">
                      @for (b of batches(); track b.id) {
                        <option [value]="b.id">
                          صلاحية {{ b.expiryDate | date:'yyyy/MM/dd' }} — رصيد {{ b.quantity }} وحدة — تكلفة {{ b.purchasePrice | number:'1.2-2' }}
                        </option>
                      }
                    </select>
                  }
                </div>

                <!-- Quantity + unit -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5">
                      {{ mode() === 'writeOff' ? 'الكمية المراد إعدامها *' : 'الكمية الفعلية بعد الجرد *' }}
                    </label>
                    <input id="adjust-qty" type="number" min="0" [(ngModel)]="qtyInput"
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5">الوحدة</label>
                    <select id="adjust-unit" [(ngModel)]="unitFactor"
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/30">
                      @for (u of unitOptions(); track u.id) {
                        <option [ngValue]="u.conversionFactor">{{ u.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Preview -->
                @if (selectedBatch(); as b) {
                  <div class="rounded-xl border px-4 py-3 text-xs space-y-1"
                    [class]="mode() === 'writeOff' ? 'bg-rose-50/60 border-rose-200 text-rose-900' : 'bg-indigo-50/60 border-indigo-200 text-indigo-900'">
                    <div class="flex justify-between"><span>الرصيد المسجل حالياً</span><b>{{ b.quantity }} وحدة أساسية</b></div>
                    <div class="flex justify-between"><span>الكمية المدخلة بالوحدة الأساسية</span><b>{{ baseQty() }}</b></div>
                    @if (mode() === 'count') {
                      <div class="flex justify-between"><span>الفرق</span>
                        <b [class.text-rose-600]="diff() < 0" [class.text-emerald-600]="diff() > 0">{{ diff() > 0 ? '+' : '' }}{{ diff() }}</b>
                      </div>
                    } @else {
                      <div class="flex justify-between"><span>الرصيد بعد الإعدام</span><b>{{ b.quantity - baseQty() }}</b></div>
                    }
                    <div class="flex justify-between border-t border-black/10 pt-1 mt-1">
                      <span>الأثر المالي المتوقع</span>
                      <b [class.text-rose-600]="impact() < 0" [class.text-emerald-600]="impact() > 0">{{ impact() | number:'1.2-2' }} ج.م</b>
                    </div>
                  </div>
                }

                <!-- Reason -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">السبب *</label>
                  <div class="flex flex-wrap gap-2 mb-2">
                    @for (r of reasonPresets(); track r) {
                      <button type="button" (click)="reason = r"
                        class="px-3 py-1 rounded-full text-[11px] font-bold border transition-all"
                        [class]="reason === r ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
                        {{ r }}
                      </button>
                    }
                  </div>
                  <input id="adjust-reason" type="text" [(ngModel)]="reason" maxlength="500" placeholder="اكتب السبب أو اختر من الأعلى"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                </div>
              }
            </div>

            <div class="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <button (click)="closeModal()" class="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">إلغاء</button>
              <button id="adjust-submit" (click)="submit()" [disabled]="!canSubmit() || saving()"
                class="text-white font-bold px-6 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                [class]="mode() === 'writeOff' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'">
                {{ saving() ? 'جاري الحفظ...' : (mode() === 'writeOff' ? 'تأكيد الإعدام' : 'تأكيد التسوية') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class StockAdjustmentsComponent implements OnInit {
  private service = inject(StockAdjustmentsService);
  private productsService = inject(ProductsService);
  private notify = inject(NotificationService);

  // History
  rows = signal<StockAdjustmentDto[]>([]);
  summary = signal<StockAdjustmentSummaryDto>({ totalLoss: 0, totalSurplus: 0, writeOffCount: 0, adjustmentCount: 0 });
  loading = signal(false);
  currentPage = signal(1);
  totalPages = signal(0);
  totalCount = signal(0);
  fromDate = '';
  toDate = '';

  // Modal
  showModal = signal(false);
  mode = signal<AdjustMode>('writeOff');
  saving = signal(false);

  productSearch = '';
  productResults = signal<ProductListDto[]>([]);
  selectedProduct = signal<ProductListDto | null>(null);
  batches = signal<BatchOptionDto[]>([]);
  batchId = '';
  qtyInput: number | null = null;
  unitFactor = 1;
  reason = '';

  private searchTimeout: any;

  reasonPresets = computed(() => (this.mode() === 'writeOff' ? WRITE_OFF_REASONS : COUNT_REASONS));

  unitOptions = computed<ProductUnitDto[]>(() => {
    const units = this.selectedProduct()?.units ?? [];
    return [...units].sort((a, b) => a.conversionFactor - b.conversionFactor);
  });

  ngOnInit() {
    this.load();
  }

  // ── History ──

  load() {
    this.loading.set(true);
    this.service.getAll({
      page: this.currentPage(),
      pageSize: 15,
      from: this.fromDate || undefined,
      to: this.toDate || undefined
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.summary.set(res.data.summary);
          this.rows.set(res.data.page.items);
          this.totalCount.set(res.data.page.totalCount);
          this.totalPages.set(res.data.page.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.load();
  }

  clearFilters() {
    this.fromDate = '';
    this.toDate = '';
    this.onFilterChange();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  isDecrease(row: StockAdjustmentDto): boolean {
    return row.type === 'Damage' || row.quantity < 0;
  }

  absQty(row: StockAdjustmentDto): number {
    return Math.abs(row.quantity);
  }

  // ── Modal ──

  openModal(mode: AdjustMode) {
    this.mode.set(mode);
    this.productSearch = '';
    this.productResults.set([]);
    this.selectedProduct.set(null);
    this.batches.set([]);
    this.batchId = '';
    this.qtyInput = null;
    this.unitFactor = 1;
    this.reason = '';
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onProductSearch() {
    clearTimeout(this.searchTimeout);
    const term = this.productSearch.trim();
    if (term.length < 2) {
      this.productResults.set([]);
      return;
    }
    this.searchTimeout = setTimeout(() => {
      this.productsService.getAll({ page: 1, pageSize: 8, search: term }).subscribe({
        next: (res) => { if (res.success) this.productResults.set(res.data.items); }
      });
    }, 300);
  }

  selectProduct(product: ProductListDto) {
    this.selectedProduct.set(product);
    this.productResults.set([]);

    // Default to the product's default sale unit (usually the box).
    const units = this.unitOptions();
    const def = units.find(u => u.isDefaultSale) ?? units[0];
    this.unitFactor = def ? def.conversionFactor : 1;

    this.service.getBatches(product.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.batches.set(res.data.items);
          this.batchId = res.data.items[0]?.id ?? '';
        }
      }
    });
  }

  clearProduct() {
    this.selectedProduct.set(null);
    this.batches.set([]);
    this.batchId = '';
    this.productSearch = '';
  }

  selectedBatch(): BatchOptionDto | null {
    return this.batches().find(b => b.id === this.batchId) ?? null;
  }

  baseQty(): number {
    if (this.qtyInput === null || this.qtyInput === undefined) return 0;
    return Math.round(Number(this.qtyInput) * Number(this.unitFactor));
  }

  /** Count mode only: counted − recorded (base units). */
  diff(): number {
    const b = this.selectedBatch();
    return b ? this.baseQty() - b.quantity : 0;
  }

  /** Money impact: negative = loss, positive = surplus. */
  impact(): number {
    const b = this.selectedBatch();
    if (!b) return 0;
    const units = this.mode() === 'writeOff' ? -this.baseQty() : this.diff();
    return Math.round(units * b.purchasePrice * 100) / 100;
  }

  canSubmit(): boolean {
    const b = this.selectedBatch();
    if (!this.selectedProduct() || !b || !this.reason.trim()) return false;
    if (this.qtyInput === null || this.qtyInput < 0) return false;

    if (this.mode() === 'writeOff') {
      return this.baseQty() > 0 && this.baseQty() <= b.quantity;
    }
    return this.diff() !== 0;
  }

  submit() {
    const product = this.selectedProduct();
    if (!product || !this.canSubmit()) return;

    this.saving.set(true);
    const req = {
      productId: product.id,
      batchId: this.batchId,
      quantity: this.baseQty(),
      reason: this.reason.trim()
    };
    const call = this.mode() === 'writeOff' ? this.service.writeOff(req) : this.service.count(req);

    call.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.notify.success(this.mode() === 'writeOff' ? 'تم تسجيل الإعدام وخصم الكمية من المخزن' : 'تمت تسوية المخزون بنجاح');
          this.closeModal();
          this.currentPage.set(1);
          this.load();
        } else {
          this.notify.error(res.message || 'تعذر تنفيذ العملية');
        }
      },
      error: () => this.saving.set(false)
    });
  }
}

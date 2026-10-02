import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListDto } from '../../../../core/models/product.model';
import { ProductRowComponent, AddToCartEvent } from '../product-row/product-row.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.arrowdown)': 'onArrowDown($event)',
    '(keydown.arrowup)': 'onArrowUp($event)',
    '(keydown.enter)': 'onEnterKey($event)'
  },
  template: `
    <div class="h-full flex flex-col min-h-0">
      <!-- 1. Loading State -->
      @if (isLoading()) {
        <div class="space-y-2.5 p-1 animate-pulse">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"></div>
          }
        </div>
      }

      <!-- 2. Error State -->
      @else if (hasError()) {
        <div class="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">حدث خطأ أثناء تحميل الأصناف</h4>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">تأكد من اتصال السيرفر وحاول مجدداً</p>
          <button
            type="button"
            (click)="retry.emit()"
            class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            إعادة المحاولة
          </button>
        </div>
      }

      <!-- 3. Products Rows List (إذا وُجدت منتجات تُعرض فوراً) -->
      @else if (products().length > 0) {
        <div class="flex-1 overflow-y-auto space-y-2 p-1 focus:outline-none" tabindex="0">
          @for (prod of products(); track prod.id; let idx = $index) {
            <app-product-row
              [product]="prod"
              [cartQuantity]="getItemQuantity(prod.id)"
              [isActive]="activeRowIndex() === idx"
              (addToCart)="addToCart.emit($event)"
            />
          }
        </div>
      }

      <!-- 4. Initial Empty State (قبل البدء بالبحث أو اختيار تصنيف) -->
      @else if (isInitialState()) {
        <div class="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
            </svg>
          </div>
          <h4 class="text-base font-extrabold text-slate-700 dark:text-slate-200">جاهز للبيع</h4>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            ابحث بالاسم أو امسح الباركود، أو اختر تصنيفاً من القائمة أعلاه لعرض الأصناف
          </p>
        </div>
      }

      <!-- 5. No Results Found (بعد البحث أو الفلترة) -->
      @else {
        <div class="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">لا توجد منتجات مطابقة</h4>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">جرّب كلمة بحث أخرى أو غيّر التصنيف المختار</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class ProductListComponent {
  // ── Inputs ──
  products = input<ProductListDto[]>([]);
  isLoading = input<boolean>(false);
  hasError = input<boolean>(false);
  isInitialState = input<boolean>(true);
  cartQuantities = input<Map<string, number>>(new Map());

  // ── Outputs ──
  addToCart = output<AddToCartEvent>();
  retry = output<void>();

  // ── State ──
  activeRowIndex = signal<number>(-1);

  getItemQuantity(productId: string): number {
    return this.cartQuantities().get(productId) ?? 0;
  }

  // ── Keyboard Navigation (Arrow Keys & Enter) ──

  onArrowDown(event: Event): void {
    const list = this.products();
    if (list.length === 0) return;
    event.preventDefault();
    const next = (this.activeRowIndex() + 1) % list.length;
    this.activeRowIndex.set(next);
  }

  onArrowUp(event: Event): void {
    const list = this.products();
    if (list.length === 0) return;
    event.preventDefault();
    const prev = this.activeRowIndex() <= 0 ? list.length - 1 : this.activeRowIndex() - 1;
    this.activeRowIndex.set(prev);
  }

  onEnterKey(event: Event): void {
    const idx = this.activeRowIndex();
    const list = this.products();
    if (idx >= 0 && idx < list.length) {
      event.preventDefault();
      const p = list[idx];
      if (p.totalStock > 0) {
        this.addToCart.emit({ product: p });
      }
    }
  }
}

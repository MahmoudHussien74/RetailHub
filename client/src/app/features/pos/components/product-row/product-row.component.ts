import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  OnInit,
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListDto, ProductUnitDto } from '../../../../core/models/product.model';

export interface AddToCartEvent {
  product: ProductListDto;
  unit?: ProductUnitDto;
}

@Component({
  selector: 'app-product-row',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="button"
      tabindex="0"
      (click)="onRowClick()"
      (keydown.enter)="onRowClick()"
      [class.opacity-50]="isOutOfStock()"
      [class.cursor-not-allowed]="isOutOfStock()"
      [class.pointer-events-none]="isOutOfStock()"
      [class.bg-emerald-50/60]="isActive() && !isOutOfStock()"
      [class.dark:bg-emerald-950/20]="isActive() && !isOutOfStock()"
      [class.ring-2]="isActive()"
      [class.ring-emerald-500]="isActive()"
      class="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all duration-150 cursor-pointer select-none text-start"
    >
      <!-- Right Section (in RTL): Stock Dot, Product Name & Pack Info -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Stock Colored Dot -->
        <span
          class="w-3 h-3 rounded-full flex-shrink-0"
          [ngClass]="stockStatus().dotClass"
          [title]="stockStatus().text"
        ></span>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h4 class="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
              {{ product().nameAr }}
            </h4>

            @if (cartQuantity() > 0) {
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span>{{ cartQuantity() }}</span>
                <span>في السلة</span>
              </span>
            }
          </div>

          <!-- Pack Subtitle & Brand/Manufacturer -->
          <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
            @if (product().brandNameAr) {
              <span>{{ product().brandNameAr }}</span>
              <span>•</span>
            }
            <span>{{ stockStatus().text }}</span>
          </div>
        </div>
      </div>

      <!-- Left Section (in RTL): Unit Chips, Price & Add Button -->
      <div class="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
        <!-- Unit Selection Chips (علبة / شريط / قرص) -->
        <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
          @if (hasMultipleUnits()) {
            @for (unit of unitsList(); track unit.id) {
              <button
                type="button"
                (click)="onSelectUnit($event, unit)"
                [class]="selectedUnit()?.id === unit.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'"
                class="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all whitespace-nowrap cursor-pointer"
              >
                {{ unit.name }}
              </button>
            }
          } @else {
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
              {{ singleUnitName() }}
            </span>
          }
        </div>

        <!-- Price Display -->
        <div class="text-end min-w-[85px]">
          <div class="flex items-baseline justify-end gap-1">
            <span class="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">
              {{ displayPrice() | number:'1.2-2' }}
            </span>
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400">ج.م</span>
          </div>
        </div>

        <!-- Add Button -->
        <button
          type="button"
          (click)="onAddButtonClick($event)"
          [disabled]="isOutOfStock()"
          class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>إضافة</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProductRowComponent implements OnInit {
  // ── Inputs ──
  product = input.required<ProductListDto>();
  cartQuantity = input<number>(0);
  isActive = input<boolean>(false);

  // ── Outputs ──
  addToCart = output<AddToCartEvent>();

  // ── State Signals ──
  selectedUnit = signal<ProductUnitDto | null>(null);

  elementRef = inject(ElementRef);

  ngOnInit(): void {
    const units = this.product().units;
    if (units && units.length > 0) {
      const defaultUnit = units.find(u => u.isDefaultSale) || units[0];
      this.selectedUnit.set(defaultUnit);
    }
  }

  // ── Computed Properties ──

  isOutOfStock = computed(() => (this.product().totalStock ?? 0) <= 0);

  unitsList = computed<ProductUnitDto[]>(() => this.product().units || []);

  hasMultipleUnits = computed(() => this.unitsList().length > 1);

  singleUnitName = computed(() => {
    const list = this.unitsList();
    return list.length === 1 ? list[0].name : 'علبة';
  });

  displayPrice = computed(() => {
    const u = this.selectedUnit();
    if (u && typeof u.salePrice === 'number' && u.salePrice > 0) {
      return u.salePrice;
    }
    return this.product().sellingPrice;
  });

  stockStatus = computed(() => {
    const stock = this.product().totalStock ?? 0;
    const stockDisplay = this.product().stockDisplay;

    if (stock <= 0) {
      return {
        text: 'نفد المخزون',
        dotClass: 'bg-slate-400 dark:bg-slate-600'
      };
    }

    if (stock <= 5) {
      return {
        text: stockDisplay ? `متبقي ${stockDisplay}` : `متبقي ${stock}`,
        dotClass: 'bg-rose-500 animate-pulse'
      };
    }

    if (stock <= 20) {
      return {
        text: stockDisplay ? `متبقي ${stockDisplay}` : `متبقي ${stock}`,
        dotClass: 'bg-amber-500'
      };
    }

    return {
      text: stockDisplay ? `متوفر (${stockDisplay})` : `متوفر (${stock})`,
      dotClass: 'bg-emerald-500'
    };
  });

  // ── Actions ──

  onSelectUnit(event: Event, unit: ProductUnitDto): void {
    event.stopPropagation();
    this.selectedUnit.set(unit);
  }

  onAddButtonClick(event: Event): void {
    event.stopPropagation();
    this.onRowClick();
  }

  onRowClick(): void {
    if (this.isOutOfStock()) return;

    this.addToCart.emit({
      product: this.product(),
      unit: this.selectedUnit() || undefined
    });
  }
}

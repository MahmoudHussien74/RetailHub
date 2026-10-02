import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListDto, ProductUnitDto } from '../../../../core/models/product.model';

export interface AddToCartEvent {
  product: ProductListDto;
  unit?: ProductUnitDto;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="button"
      tabindex="0"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardClick()"
      [class.opacity-50]="isOutOfStock()"
      [class.cursor-not-allowed]="isOutOfStock()"
      [class.pointer-events-none]="isOutOfStock()"
      [class.border-emerald-500]="cartQuantity() > 0"
      [class.ring-2]="cartQuantity() > 0"
      [class.ring-emerald-500/20]="cartQuantity() > 0"
      class="group relative flex flex-col justify-between h-[205px] p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-200 text-start select-none cursor-pointer overflow-hidden"
    >
      <!-- Top Section: Stock Indicator & In-Cart Badge -->
      <div class="flex items-center justify-between gap-2 flex-shrink-0">
        <!-- Stock Status with Colored Dot -->
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border"
          [ngClass]="stockStatus().badgeClass">
          <span class="w-2 h-2 rounded-full flex-shrink-0" [ngClass]="stockStatus().dotClass"></span>
          <span>{{ stockStatus().text }}</span>
        </div>

        <!-- In-Cart Quantity Badge -->
        @if (cartQuantity() > 0) {
          <div
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-xs animate-scale-in"
            title="الكمية المضافة في السلة"
          >
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <span>{{ cartQuantity() }}</span>
          </div>
        }
      </div>

      <!-- Center Section: Title & Pack Subtitle -->
      <div class="my-auto py-1">
        <h4
          class="font-extrabold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
          [title]="product().nameAr"
        >
          {{ product().nameAr }}
        </h4>

        <!-- Pack / Brand / English Subtitle -->
        <p class="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">
          {{ subtitleText() }}
        </p>
      </div>

      <!-- Bottom Section: Unit Chips & Price -->
      <div class="flex-shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <!-- Unit Chips (علبة / شريط / قرص) -->
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar mb-2" (click)="$event.stopPropagation()">
          @if (hasMultipleUnits()) {
            @for (unit of unitsList(); track unit.id) {
              <button
                type="button"
                (click)="onSelectUnit($event, unit)"
                [class]="selectedUnit()?.id === unit.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'"
                class="px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap cursor-pointer"
              >
                {{ unit.name }}
              </button>
            }
          } @else {
            <span class="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
              {{ singleUnitName() }}
            </span>
          }
        </div>

        <!-- Price Display (Largest Element) & Optional Admin Purchase Price -->
        <div class="flex items-end justify-between gap-1">
          <div>
            @if (isAdmin() && product().averageCost > 0) {
              <span class="text-[10px] font-bold text-amber-700 dark:text-amber-400 block -mb-0.5">
                تكلفة: {{ product().averageCost | number:'1.2-2' }}
              </span>
            }
            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {{ activeUnitName() }}
            </span>
          </div>

          <div class="text-end">
            <div class="flex items-baseline justify-end gap-1">
              <span class="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                {{ displayPrice() | number:'1.2-2' }}
              </span>
              <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">ج.م</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-scale-in {
      animation: scaleIn 0.15s ease-out;
    }
  `]
})
export class ProductCardComponent implements OnInit {
  // ── Inputs ──
  product = input.required<ProductListDto>();
  cartQuantity = input<number>(0);
  isAdmin = input<boolean>(false);

  // ── Outputs ──
  addToCart = output<AddToCartEvent>();

  // ── State Signals ──
  selectedUnit = signal<ProductUnitDto | null>(null);

  ngOnInit(): void {
    const units = this.product().units;
    if (units && units.length > 0) {
      const defaultUnit = units.find(u => u.isDefaultSale) || units[0];
      this.selectedUnit.set(defaultUnit);
    }
  }

  // ── Computed Properties (No logic in template) ──

  isOutOfStock = computed(() => (this.product().totalStock ?? 0) <= 0);

  unitsList = computed<ProductUnitDto[]>(() => this.product().units || []);

  hasMultipleUnits = computed(() => this.unitsList().length > 1);

  singleUnitName = computed(() => {
    const list = this.unitsList();
    return list.length === 1 ? list[0].name : 'علبة';
  });

  activeUnitName = computed(() => {
    const u = this.selectedUnit();
    return u ? u.name : (this.singleUnitName());
  });

  displayPrice = computed(() => {
    const u = this.selectedUnit();
    if (u && typeof u.salePrice === 'number' && u.salePrice > 0) {
      return u.salePrice;
    }
    return this.product().sellingPrice;
  });

  subtitleText = computed(() => {
    const p = this.product();
    if (p.brandNameAr) return p.brandNameAr;
    if (p.categoryNameAr) return p.categoryNameAr;
    if (p.nameEn) return p.nameEn;
    return 'مستحضر صيدلي';
  });

  stockStatus = computed(() => {
    const stock = this.product().totalStock ?? 0;
    const stockDisplay = this.product().stockDisplay;

    if (stock <= 0) {
      return {
        text: 'نفد المخزون',
        dotClass: 'bg-slate-400 dark:bg-slate-600',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
      };
    }

    if (stock <= 5) {
      return {
        text: stockDisplay ? `متبقي ${stockDisplay}` : `متبقي ${stock}`,
        dotClass: 'bg-rose-500 animate-pulse',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
      };
    }

    if (stock <= 20) {
      return {
        text: stockDisplay ? `متبقي ${stockDisplay}` : `متبقي ${stock}`,
        dotClass: 'bg-amber-500',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
      };
    }

    return {
      text: stockDisplay ? `متوفر (${stockDisplay})` : `متوفر (${stock})`,
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
    };
  });

  // ── User Actions ──

  onSelectUnit(event: Event, unit: ProductUnitDto): void {
    event.stopPropagation();
    this.selectedUnit.set(unit);
  }

  onCardClick(): void {
    if (this.isOutOfStock()) return;

    this.addToCart.emit({
      product: this.product(),
      unit: this.selectedUnit() || undefined
    });
  }
}

import { Injectable, signal, computed } from '@angular/core';
import { ProductListDto, ProductUnitDto } from '../models/product.model';
import { CustomerListDto } from '../models/customer.model';
import { StorageService } from '../services/storage.service';

export interface CartItem {
  productId: string;
  barcode: string;
  nameAr: string;
  nameEn?: string;
  sellingPrice: number;
  costPrice: number;         // Base average cost (purchase price)
  unitCostPrice: number;     // Cost price for the selected unit
  quantity: number;
  availableStock: number;
  stockDisplay?: string;
  unitId?: string;
  unitName?: string;
  conversionFactor?: number;
  units?: ProductUnitDto[];
  hasError?: boolean;        // true if backend rejected this item (e.g. insufficient stock)
  maxAvailable?: number;     // server-reported max quantity when error occurs
}

const CART_STORAGE_KEY = 'rh_cart_draft';

@Injectable({ providedIn: 'root' })
export class CartStore {
  // ── State Signals ──
  readonly items = signal<CartItem[]>([]);
  readonly selectedCustomer = signal<CustomerListDto | null>(null);
  readonly discountPercent = signal<number>(0);
  readonly discountReason = signal<string>('');
  readonly paymentMethod = signal<'cash' | 'card' | 'credit' | 'partial'>('cash');
  readonly amountPaid = signal<number>(0);

  // ── Computed Values ──
  readonly itemCount = computed(() => this.items().length);

  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
  );

  readonly discountAmount = computed(() =>
    this.subtotal() * (this.discountPercent() / 100)
  );

  readonly grandTotal = computed(() =>
    this.subtotal() - this.discountAmount()
  );

  readonly changeDue = computed(() =>
    Math.max(0, this.amountPaid() - this.grandTotal())
  );

  readonly remainingBalance = computed(() =>
    Math.max(0, this.grandTotal() - this.amountPaid())
  );

  constructor(private storage: StorageService) {
    this.loadDraft();
  }

  // ── Cart Actions ──

  addProduct(product: ProductListDto, targetUnit?: ProductUnitDto): void {
    const unit = targetUnit || product.units?.find(u => u.isDefaultSale) || product.units?.[0];
    const unitId = unit?.id;
    const unitName = unit?.name || 'وحدة';
    const conversionFactor = unit?.conversionFactor || 1;
    const sellingPrice = unit?.salePrice ?? product.sellingPrice;
    const costPrice = product.averageCost ?? 0;
    const unitCostPrice = Math.round(costPrice * conversionFactor * 100) / 100;

    this.items.update(items => {
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        return items.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, hasError: false }
            : i
        );
      }
      return [...items, {
        productId: product.id,
        barcode: product.barcode,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        sellingPrice,
        costPrice,
        unitCostPrice,
        quantity: 1,
        availableStock: product.totalStock,
        stockDisplay: product.stockDisplay,
        unitId,
        unitName,
        conversionFactor,
        units: product.units || [],
      }];
    });
    this.saveDraft();
  }

  changeUnit(productId: string, newUnit: ProductUnitDto): void {
    this.items.update(items =>
      items.map(i =>
        i.productId === productId
          ? {
              ...i,
              unitId: newUnit.id,
              unitName: newUnit.name,
              conversionFactor: newUnit.conversionFactor,
              sellingPrice: newUnit.salePrice,
              unitCostPrice: Math.round(i.costPrice * newUnit.conversionFactor * 100) / 100,
              hasError: false
            }
          : i
      )
    );
    this.saveDraft();
  }

  updateItemUnits(productId: string, units: ProductUnitDto[]): void {
    this.items.update(items =>
      items.map(i =>
        i.productId === productId
          ? { ...i, units }
          : i
      )
    );
    this.saveDraft();
  }

  isStockExceeded(item: CartItem): boolean {
    return item.quantity * (item.conversionFactor || 1) > item.availableStock;
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this.items.update(items =>
      items.map(i =>
        i.productId === productId
          ? { ...i, quantity, hasError: false }
          : i
      )
    );
    this.saveDraft();
  }

  increaseQty(productId: string): void {
    this.items.update(items =>
      items.map(i =>
        i.productId === productId
          ? { ...i, quantity: i.quantity + 1, hasError: false }
          : i
      )
    );
    this.saveDraft();
  }

  decreaseQty(productId: string): void {
    this.items.update(items => {
      const item = items.find(i => i.productId === productId);
      if (item && item.quantity <= 1) {
        return items.filter(i => i.productId !== productId);
      }
      return items.map(i =>
        i.productId === productId
          ? { ...i, quantity: i.quantity - 1, hasError: false }
          : i
      );
    });
    this.saveDraft();
  }

  removeItem(productId: string): void {
    this.items.update(items => items.filter(i => i.productId !== productId));
    this.saveDraft();
  }

  markItemError(productId: string, maxAvailable: number): void {
    this.items.update(items =>
      items.map(i =>
        i.productId === productId
          ? { ...i, hasError: true, maxAvailable }
          : i
      )
    );
  }

  selectCustomer(customer: CustomerListDto | null): void {
    this.selectedCustomer.set(customer);
  }

  setDiscount(percent: number): void {
    this.discountPercent.set(Math.min(100, Math.max(0, percent)));
  }

  setDiscountReason(reason: string): void {
    this.discountReason.set(reason);
  }

  setPaymentMethod(method: 'cash' | 'card' | 'credit' | 'partial'): void {
    this.paymentMethod.set(method);
  }

  setAmountPaid(amount: number): void {
    this.amountPaid.set(amount);
  }

  clearCart(): void {
    this.items.set([]);
    this.selectedCustomer.set(null);
    this.discountPercent.set(0);
    this.discountReason.set('');
    this.paymentMethod.set('cash');
    this.amountPaid.set(0);
    this.storage.remove(CART_STORAGE_KEY);
  }

  // ── Draft Persistence ──

  saveDraft(): void {
    this.storage.set(CART_STORAGE_KEY, {
      items: this.items(),
      customerId: this.selectedCustomer()?.id || null,
      discountPercent: this.discountPercent(),
    });
  }

  loadDraft(): void {
    const draft = this.storage.get<any>(CART_STORAGE_KEY);
    if (draft?.items?.length) {
      this.items.set(draft.items);
      this.discountPercent.set(draft.discountPercent || 0);
    }
  }

  hasDraft(): boolean {
    const draft = this.storage.get<any>(CART_STORAGE_KEY);
    return !!(draft?.items?.length);
  }
}
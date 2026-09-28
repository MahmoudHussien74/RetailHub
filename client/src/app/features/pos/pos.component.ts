import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CartItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  availableStock: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col lg:flex-row gap-5">
      <!-- Left / Main: Products & Search Area -->
      <div class="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- Search and Barcode Header -->
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
          <div class="relative flex-1">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="امسح الباركود أو ابحث عن المنتج بالاسم... (اضغط Enter)"
              class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              autofocus
            />
            <svg class="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <div class="flex gap-2">
            <button class="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm">
              <span>جميع الأصناف</span>
            </button>
            <button class="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
              <span>مستحضرات التجميل</span>
            </button>
          </div>
        </div>

        <!-- Quick Select Products Grid -->
        <div class="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          @for (prod of filteredProducts(); track prod.id) {
            <button 
              (click)="addToCart(prod)"
              class="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md bg-white hover:bg-emerald-50/30 transition-all text-right group">
              <div>
                <span class="text-[10px] font-bold text-slate-400 font-mono">{{ prod.barcode }}</span>
                <h4 class="font-bold text-sm text-slate-800 line-clamp-2 mt-0.5 group-hover:text-emerald-700">{{ prod.name }}</h4>
              </div>
              <div class="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                <span class="text-xs font-semibold text-slate-400">متبقي: {{ prod.availableStock }}</span>
                <span class="font-black text-sm text-emerald-600">{{ prod.price | number:'1.2-2' }} ج.م</span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Right: Cart & Fast Checkout -->
      <div class="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">
        <!-- Cart Header -->
        <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <h3 class="font-bold text-sm">سلة المبيعات ({{ cart().length }})</h3>
          </div>
          <button (click)="clearCart()" class="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors">
            تفريغ السلة
          </button>
        </div>

        <!-- Cart Items List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          @if (cart().length === 0) {
            <div class="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <svg class="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <p class="text-sm font-bold text-slate-600">السلة فارغة حالياً</p>
              <p class="text-xs text-slate-400 mt-1">اختر الأصناف أو امسح الباركود للبدء</p>
            </div>
          } @else {
            @for (item of cart(); track item.id) {
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div class="flex-1 min-w-0 pr-1">
                  <h5 class="text-xs font-bold text-slate-800 truncate">{{ item.name }}</h5>
                  <span class="text-[11px] text-slate-400 font-semibold">{{ item.price | number:'1.2-2' }} × {{ item.quantity }} = {{ (item.price * item.quantity) | number:'1.2-2' }} ج.م</span>
                </div>

                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <button (click)="decreaseQty(item)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center text-xs">
                    -
                  </button>
                  <span class="w-7 text-center font-bold text-xs text-slate-800">{{ item.quantity }}</span>
                  <button (click)="increaseQty(item)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 flex items-center justify-center text-xs">
                    +
                  </button>
                  <button (click)="removeItem(item)" class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 flex items-center justify-center text-xs mr-1">
                    ✕
                  </button>
                </div>
              </div>
            }
          }
        </div>

        <!-- Cart Summary & Actions -->
        <div class="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
          <div class="space-y-1.5 text-xs text-slate-600 font-medium">
            <div class="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span class="font-bold text-slate-800">{{ subtotal() | number:'1.2-2' }} ج.م</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>الخصم:</span>
              <span class="font-bold">0.00 ج.م</span>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span class="text-sm font-bold text-slate-800">الإجمالي النهائي:</span>
            <span class="text-2xl font-black text-emerald-600">{{ subtotal() | number:'1.2-2' }} <span class="text-xs font-semibold text-slate-500">ج.م</span></span>
          </div>

          <!-- Checkout Button -->
          <button 
            [disabled]="cart().length === 0"
            class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>إتمام البيع ودفع كاش (F1)</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PosComponent {
  searchQuery = '';
  
  products = signal<CartItem[]>([
    { id: '1', name: 'كريم مرطب للبشرة سيفاكلار 50 مل', barcode: '6224001122334', price: 185.00, quantity: 1, availableStock: 24 },
    { id: '2', name: 'سيروم فيتامين سي نضارة 30 مل', barcode: '6224001122335', price: 240.00, quantity: 1, availableStock: 15 },
    { id: '3', name: 'واقي شمس جل دراي تاتش SPF50+', barcode: '6224001122336', price: 320.00, quantity: 1, availableStock: 18 },
    { id: '4', name: 'غسول رغوي للبشرة الدهنية 200 مل', barcode: '6224001122337', price: 150.00, quantity: 1, availableStock: 30 },
    { id: '5', name: 'ماسك طمي نقي لإزالة الشوائب', barcode: '6224001122338', price: 95.00, quantity: 1, availableStock: 12 },
    { id: '6', name: 'شامبو مغذي بزيت الأرجان 400 مل', barcode: '6224001122339', price: 130.00, quantity: 1, availableStock: 20 },
  ]);

  cart = signal<CartItem[]>([]);

  filteredProducts = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.products();
    return this.products().filter(p => 
      p.name.toLowerCase().includes(q) || p.barcode.includes(q)
    );
  });

  subtotal = computed(() => {
    return this.cart().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  addToCart(prod: CartItem) {
    this.cart.update(items => {
      const existing = items.find(i => i.id === prod.id);
      if (existing) {
        return items.map(i => i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...items, { ...prod, quantity: 1 }];
    });
  }

  increaseQty(item: CartItem) {
    this.cart.update(items => 
      items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
    );
  }

  decreaseQty(item: CartItem) {
    this.cart.update(items => {
      const existing = items.find(i => i.id === item.id);
      if (existing && existing.quantity > 1) {
        return items.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return items.filter(i => i.id !== item.id);
    });
  }

  removeItem(item: CartItem) {
    this.cart.update(items => items.filter(i => i.id !== item.id));
  }

  clearCart() {
    this.cart.set([]);
  }
}

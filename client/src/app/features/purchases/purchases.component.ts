import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService, PurchaseInvoicesService } from '../../core/services/suppliers.service';
import { ProductsService } from '../../core/services/products.service';
import { NotificationService } from '../../core/services/notification.service';
import { SupplierListDto, CreateSupplierDto, PurchaseInvoiceListDto, PurchaseInvoiceDetailDto, CreatePurchaseRequest, PurchaseItemRequest } from '../../core/models/purchase.model';
import { ProductListDto } from '../../core/models/product.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

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
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الاسم</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الهاتف</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                  <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (sup of suppliers(); track sup.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-semibold text-slate-800">{{ sup.name }}</td>
                    <td class="px-5 py-3.5 text-sm text-slate-500" dir="ltr">{{ sup.phone || '—' }}</td>
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
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-auto" (click)="$event.stopPropagation()">
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 sticky top-0 z-10">
              <h3 class="text-lg font-bold text-white">فاتورة شراء جديدة</h3>
            </div>
            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5">المورد *</label>
                  <select [(ngModel)]="purchaseSupplierId" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                    <option value="">اختر المورد</option>
                    @for (sup of suppliers(); track sup.id) {
                      <option [value]="sup.id">{{ sup.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5">تاريخ الشراء *</label>
                  <input type="date" [(ngModel)]="purchaseDate" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5">ملاحظات</label>
                <input type="text" [(ngModel)]="purchaseNotes" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"/>
              </div>

              <!-- Items -->
              <div class="border border-slate-200 rounded-xl p-4">
                <h4 class="text-sm font-bold text-slate-700 mb-3">أصناف الفاتورة</h4>
                @for (item of purchaseItems; track $index; let i = $index) {
                  <div class="grid grid-cols-12 gap-3 mb-3 items-end">
                    <div class="col-span-4">
                      <label class="block text-[10px] font-bold text-slate-400 mb-1">المنتج</label>
                      <select [(ngModel)]="item.productId" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30">
                        <option value="">اختر المنتج</option>
                        @for (p of allProducts(); track p.id) {
                          <option [value]="p.id">{{ p.nameAr }}</option>
                        }
                      </select>
                    </div>
                    <div class="col-span-2">
                      <label class="block text-[10px] font-bold text-slate-400 mb-1">الكمية</label>
                      <input type="number" [(ngModel)]="item.quantity" min="1" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                    </div>
                    <div class="col-span-2">
                      <label class="block text-[10px] font-bold text-slate-400 mb-1">سعر الشراء</label>
                      <input type="number" [(ngModel)]="item.unitCost" min="0" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                    </div>
                    <div class="col-span-3">
                      <label class="block text-[10px] font-bold text-slate-400 mb-1">تاريخ الصلاحية</label>
                      <input type="date" [(ngModel)]="item.expiryDate" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                    </div>
                    <div class="col-span-1">
                      <button (click)="removePurchaseItem(i)" class="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  </div>
                }
                <button (click)="addPurchaseItem()" class="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1 mt-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  إضافة صنف
                </button>
              </div>
            </div>
            <div class="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 sticky bottom-0">
              <button (click)="showPurchaseModal.set(false)" class="px-5 py-2 text-sm font-semibold text-slate-600">إلغاء</button>
              <button (click)="submitPurchase()" [disabled]="saving()"
                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all disabled:opacity-50">
                {{ saving() ? 'جاري الحفظ...' : 'تسجيل الفاتورة' }}
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
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">سعر الوحدة</th>
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">الصلاحية</th>
                    <th class="text-right px-4 py-2.5 text-xs font-bold text-slate-500">الإجمالي</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of selectedPurchase()!.items; track item.id) {
                    <tr>
                      <td class="px-4 py-3 text-sm font-semibold text-slate-700">{{ item.productNameAr }}</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.quantity }}</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.unitCost | number:'1.2-2' }}</td>
                      <td class="px-4 py-3 text-sm text-slate-500">{{ item.expiryDate | date:'yyyy/MM/dd' }}</td>
                      <td class="px-4 py-3 text-sm font-bold text-slate-800">{{ item.lineTotal | number:'1.2-2' }} ج.م</td>
                    </tr>
                  }
                </tbody>
              </table>
              <div class="mt-4 flex justify-end">
                <div class="bg-slate-50 rounded-xl px-6 py-3">
                  <span class="text-xs text-slate-500 font-semibold">إجمالي الفاتورة: </span>
                  <span class="text-lg font-black text-slate-800">{{ selectedPurchase()!.totalAmount | number:'1.2-2' }} ج.م</span>
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
  private notify = inject(NotificationService);

  suppliers = signal<SupplierListDto[]>([]);
  purchaseInvoices = signal<PurchaseInvoiceListDto[]>([]);
  allProducts = signal<ProductListDto[]>([]);
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
  purchaseItems: PurchaseItemRequest[] = [{ productId: '', quantity: 1, unitCost: 0, expiryDate: '' }];

  // Detail
  selectedPurchase = signal<PurchaseInvoiceDetailDto | null>(null);

  ngOnInit() {
    this.loadSuppliers();
    this.loadPurchaseInvoices();
    this.loadAllProducts();
  }

  loadSuppliers() {
    this.suppliersService.getAll({ pageSize: 100 }).subscribe({
      next: (res) => { if (res.success) this.suppliers.set(res.data.items); }
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
    this.productsService.getAll({ pageSize: 200 }).subscribe({
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
    this.purchaseItems = [{ productId: '', quantity: 1, unitCost: 0, expiryDate: '' }];
    this.showPurchaseModal.set(true);
  }

  addPurchaseItem() {
    this.purchaseItems = [...this.purchaseItems, { productId: '', quantity: 1, unitCost: 0, expiryDate: '' }];
  }

  removePurchaseItem(index: number) {
    this.purchaseItems = this.purchaseItems.filter((_, i) => i !== index);
  }

  submitPurchase() {
    if (!this.purchaseSupplierId) { this.notify.error('يرجى اختيار المورد'); return; }
    const validItems = this.purchaseItems.filter(i => i.productId && i.quantity > 0 && i.unitCost > 0);
    if (validItems.length === 0) { this.notify.error('يرجى إضافة صنف واحد على الأقل'); return; }

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
          this.notify.success('تم تسجيل فاتورة الشراء بنجاح');
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

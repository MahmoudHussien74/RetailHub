import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../../core/services/customers.service';
import { PaymentsService } from '../../core/services/returns-payments.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomerListDto, CustomerDetailDto, CreateCustomerDto, UpdateCustomerDto } from '../../core/models/customer.model';
import { PaymentListDto, CreatePaymentDto } from '../../core/models/operational.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800">العملاء والديون</h2>
          <p class="text-sm text-slate-500 mt-1">إدارة حسابات العملاء ومتابعة المستحقات وتسجيل الدفعات</p>
        </div>
        <div class="flex gap-3">
          <button (click)="openAddModal()"
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            إضافة عميل جديد
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <input [(ngModel)]="searchQuery" (input)="onSearch()" type="text"
              placeholder="البحث باسم العميل أو رقم الهاتف..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all pl-10">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <button (click)="loadCustomers()"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-right text-sm">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
              <tr>
                <th class="px-5 py-4">اسم العميل</th>
                <th class="px-5 py-4">رقم الهاتف</th>
                <th class="px-5 py-4">الرصيد المتبقي</th>
                <th class="px-5 py-4">الحالة</th>
                <th class="px-5 py-4">تاريخ التسجيل</th>
                <th class="px-5 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (c of customers(); track c.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-4 font-bold text-slate-800">{{ c.name }}</td>
                  <td class="px-5 py-4 text-slate-600 font-mono text-xs" dir="ltr">{{ c.phone || '—' }}</td>
                  <td class="px-5 py-4 font-bold font-mono">
                    @if (c.balance > 0) {
                      <span class="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-xs">
                        مدين: {{ c.balance | number:'1.2-2' }} ج.م
                      </span>
                    } @else if (c.balance < 0) {
                      <span class="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-xs">
                        دائن: {{ -c.balance | number:'1.2-2' }} ج.م
                      </span>
                    } @else {
                      <span class="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                        خالص (0.00)
                      </span>
                    }
                  </td>
                  <td class="px-5 py-4">
                    <span [class]="c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                      class="px-2.5 py-1 rounded-full text-xs font-semibold">
                      {{ c.isActive ? 'نشط' : 'معطل' }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-slate-500 text-xs">
                    {{ c.createdAt | date:'yyyy/MM/dd' }}
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center justify-center gap-1.5">
                      <button (click)="openPaymentModal(c)" title="تسجيل دفعة نقدية"
                        class="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        دفعة
                      </button>
                      <button (click)="viewCustomerDetails(c)" title="تفاصيل وكشف حساب"
                        class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                      <button (click)="openEditModal(c)" title="تعديل بيانات"
                        class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-5 py-12 text-center text-slate-400">
                    <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    لا يوجد عملاء مسجلين
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <span class="text-xs text-slate-500">عرض {{ customers().length }} من {{ totalCount() }} عميل</span>
            <div class="flex gap-1">
              <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1"
                class="px-3 py-1 text-xs border rounded-lg hover:bg-slate-50 disabled:opacity-40">السابق</button>
              <span class="px-3 py-1 text-xs font-bold text-slate-700">{{ currentPage() }} / {{ totalPages() }}</span>
              <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                class="px-3 py-1 text-xs border rounded-lg hover:bg-slate-50 disabled:opacity-40">التالي</button>
            </div>
          </div>
        }
      </div>

      <!-- Add/Edit Customer Modal -->
      @if (showCustomerModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 class="text-base font-bold text-slate-800">{{ editingCustomer() ? 'تعديل عميل' : 'إضافة عميل جديد' }}</h3>
              <button (click)="showCustomerModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">اسم العميل *</label>
                <input [(ngModel)]="customerForm.name" type="text"
                  placeholder="مثال: محمد السيد"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف *</label>
                <input [(ngModel)]="customerForm.phone" type="text"
                  placeholder="01xxxxxxxxx"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">العنوان</label>
                <input [(ngModel)]="customerForm.address" type="text"
                  placeholder="العنوان أو الملاحظات"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button (click)="showCustomerModal.set(false)"
                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl">إلغاء</button>
              <button (click)="saveCustomer()" [disabled]="!customerForm.name || !customerForm.phone"
                class="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-md shadow-emerald-600/20">حفظ</button>
            </div>
          </div>
        </div>
      }

      <!-- Record Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 class="text-base font-bold text-slate-800">تسجيل دفعة نقدية</h3>
                <p class="text-xs text-slate-500">العميل: {{ selectedCustomer()?.name }}</p>
              </div>
              <button (click)="showPaymentModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center text-xs">
                <span class="text-amber-800 font-medium">الرصيد المستحق الحالي:</span>
                <span class="font-bold font-mono text-amber-900 text-sm">{{ selectedCustomer()?.balance | number:'1.2-2' }} ج.م</span>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">المبلغ المسدد (ج.م) *</label>
                <input [(ngModel)]="paymentAmount" type="number" min="1" [max]="selectedCustomer()?.balance || 999999"
                  placeholder="0.00"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-bold font-mono text-emerald-600 focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">ملاحظات / رقم الإيصال</label>
                <input [(ngModel)]="paymentNotes" type="text"
                  placeholder="دفعة تحت الحساب / كاش"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button (click)="showPaymentModal.set(false)"
                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl">إلغاء</button>
              <button (click)="submitPayment()" [disabled]="!paymentAmount || paymentAmount <= 0"
                class="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-md shadow-emerald-600/20">تأكيد الدفع</button>
            </div>
          </div>
        </div>
      }

      <!-- Customer Detail / Statement Modal -->
      @if (showDetailModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 class="text-base font-bold text-slate-800">بيانات وسجل دفعات العميل</h3>
                <p class="text-xs text-slate-500">{{ customerDetails()?.name }} — {{ customerDetails()?.phone }}</p>
              </div>
              <button (click)="showDetailModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto space-y-6 flex-1">
              <!-- Summary Card -->
              <div class="grid grid-cols-3 gap-3">
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span class="text-xs text-slate-500 block">الرصيد المستحق</span>
                  <span class="text-base font-bold font-mono text-rose-600">{{ customerDetails()?.balance | number:'1.2-2' }} ج.م</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span class="text-xs text-slate-500 block">عدد الفواتير</span>
                  <span class="text-base font-bold text-slate-800">{{ customerDetails()?.invoiceCount || 0 }}</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span class="text-xs text-slate-500 block">الحالة</span>
                  <span class="text-xs font-bold text-emerald-600 mt-1 inline-block">{{ customerDetails()?.isActive ? 'نشط' : 'معطل' }}</span>
                </div>
              </div>

              <!-- Payments List -->
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">سجل الدفعات والتحصيلات</h4>
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <table class="w-full text-right text-xs">
                    <thead class="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th class="px-3 py-2.5">التاريخ</th>
                        <th class="px-3 py-2.5">المبلغ</th>
                        <th class="px-3 py-2.5">الفاتورة المرتبطة</th>
                        <th class="px-3 py-2.5">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (p of customerPayments(); track p.id) {
                        <tr>
                          <td class="px-3 py-2.5 text-slate-600">{{ p.paymentDate | date:'yyyy/MM/dd HH:mm' }}</td>
                          <td class="px-3 py-2.5 font-bold font-mono text-emerald-600">{{ p.amount | number:'1.2-2' }} ج.م</td>
                          <td class="px-3 py-2.5 text-slate-500">{{ p.invoiceNumber || '—' }}</td>
                          <td class="px-3 py-2.5 text-slate-500">{{ p.notes || '—' }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="4" class="px-3 py-6 text-center text-slate-400">لا توجد دفعات مسجلة</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button (click)="showDetailModal.set(false)"
                class="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl">إغلاق</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomersComponent implements OnInit {
  private customersService = inject(CustomersService);
  private paymentsService = inject(PaymentsService);
  private notification = inject(NotificationService);

  customers = signal<CustomerListDto[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  searchQuery = '';

  // Modals state
  showCustomerModal = signal(false);
  editingCustomer = signal<CustomerListDto | null>(null);
  customerForm: CreateCustomerDto = { name: '', phone: '', address: '' };

  showPaymentModal = signal(false);
  selectedCustomer = signal<CustomerListDto | null>(null);
  paymentAmount: number | null = null;
  paymentNotes = '';

  showDetailModal = signal(false);
  customerDetails = signal<CustomerDetailDto | null>(null);
  customerPayments = signal<PaymentListDto[]>([]);

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.customersService.getAll({
      pageNumber: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchQuery || undefined
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.customers.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
          this.totalPages.set(res.data.totalPages);
        }
      },
      error: () => this.notification.error('فشل تحميل قائمة العملاء')
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadCustomers();
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
      this.loadCustomers();
    }
  }

  openAddModal() {
    this.editingCustomer.set(null);
    this.customerForm = { name: '', phone: '', address: '' };
    this.showCustomerModal.set(true);
  }

  openEditModal(c: CustomerListDto) {
    this.editingCustomer.set(c);
    this.customerForm = { name: c.name, phone: c.phone, address: '' };
    this.showCustomerModal.set(true);
  }

  saveCustomer() {
    if (!this.customerForm.name || !this.customerForm.phone) return;

    if (this.editingCustomer()) {
      const dto: UpdateCustomerDto = {
        id: this.editingCustomer()!.id,
        ...this.customerForm
      };
      this.customersService.update(dto.id, dto).subscribe({
        next: (res) => {
          if (res.success || res.isSuccess) {
            this.notification.success('تم تعديل بيانات العميل بنجاح');
            this.showCustomerModal.set(false);
            this.loadCustomers();
          } else {
            this.notification.error(res.message || 'فشل التعديل');
          }
        },
        error: () => this.notification.error('حدث خطأ أثناء حفظ التعديلات')
      });
    } else {
      this.customersService.create(this.customerForm).subscribe({
        next: (res) => {
          if (res.success || res.isSuccess) {
            this.notification.success('تمت إضافة العميل بنجاح');
            this.showCustomerModal.set(false);
            this.loadCustomers();
          } else {
            this.notification.error(res.message || 'فشل الحفظ');
          }
        },
        error: () => this.notification.error('حدث خطأ أثناء إضافة العميل')
      });
    }
  }

  openPaymentModal(c: CustomerListDto) {
    this.selectedCustomer.set(c);
    this.paymentAmount = c.balance > 0 ? c.balance : null;
    this.paymentNotes = '';
    this.showPaymentModal.set(true);
  }

  submitPayment() {
    const c = this.selectedCustomer();
    if (!c || !this.paymentAmount || this.paymentAmount <= 0) return;

    const dto: CreatePaymentDto = {
      customerId: c.id,
      amount: this.paymentAmount,
      notes: this.paymentNotes || undefined
    };

    this.paymentsService.create(dto).subscribe({
      next: (res) => {
        if (res.success || res.isSuccess) {
          this.notification.success('تم تسجيل الدفعة بنجاح وتحديث الرصيد');
          this.showPaymentModal.set(false);
          this.loadCustomers();
        } else {
          this.notification.error(res.message || 'فشل تسجيل الدفعة');
        }
      },
      error: () => this.notification.error('حدث خطأ أثناء تسجيل الدفعة')
    });
  }

  viewCustomerDetails(c: CustomerListDto) {
    this.customersService.getById(c.id).subscribe({
      next: (res) => {
        if ((res.success || res.isSuccess) && res.data) {
          this.customerDetails.set(res.data);
          this.showDetailModal.set(true);
          // Load payment history
          this.paymentsService.getByCustomer(c.id).subscribe({
            next: (payRes) => {
              if ((payRes.success || payRes.isSuccess) && payRes.data) {
                this.customerPayments.set(payRes.data);
              }
            }
          });
        }
      },
      error: () => this.notification.error('فشل جلب تفاصيل العميل')
    });
  }
}

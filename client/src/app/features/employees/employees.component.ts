
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeesService, SalaryAdvancesService } from '../../core/services/employees.service';
import { NotificationService } from '../../core/services/notification.service';
import { EmployeeListDto, CreateEmployeeDto, UpdateEmployeeDto, SalaryAdvanceListDto, RecordAdvanceDto } from '../../core/models/operational.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800">الموظفين وسلف الرواتب</h2>
          <p class="text-sm text-slate-500 mt-1">إدارة بيانات العاملين، الرواتب، وتسجيل وتتبع سلف الموظفين</p>
        </div>
        <div class="flex gap-3">
          <button (click)="openAdvanceModal()"
            class="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            صرف سلفة لموظف
          </button>
          <button (click)="openAddEmployeeModal()"
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            إضافة موظف جديد
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex gap-2 border-b border-slate-200 pb-1">
        <button (click)="activeTab.set('employees')"
          [class]="activeTab() === 'employees' ? 'border-b-2 border-emerald-600 text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
          class="px-5 py-3 text-sm transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          قائمة الموظفين
        </button>
        <button (click)="activeTab.set('advances')"
          [class]="activeTab() === 'advances' ? 'border-b-2 border-purple-600 text-purple-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
          class="px-5 py-3 text-sm transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          سجل السلف والخصومات
        </button>
      </div>

      <!-- Tab 1: Employees List -->
      @if (activeTab() === 'employees') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex-1 w-full relative">
              <input [(ngModel)]="empSearch" (input)="loadEmployees()" type="text"
                placeholder="البحث باسم الموظف أو رقم الهاتف..."
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500">
            </div>
            <button (click)="loadEmployees()"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
              تحديث
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-right text-sm">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                <tr>
                  <th class="px-5 py-4">اسم الموظف</th>
                  <th class="px-5 py-4">المسمى الوظيفي</th>
                  <th class="px-5 py-4">الهاتف</th>
                  <th class="px-5 py-4">الراتب الأساسي</th>
                  <th class="px-5 py-4">الحالة</th>
                  <th class="px-5 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (e of employees(); track e.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-4 font-bold text-slate-800">{{ e.name }}</td>
                    <td class="px-5 py-4 text-slate-600 text-xs">{{ e.role || '—' }}</td>
                    <td class="px-5 py-4 text-slate-500 font-mono text-xs" dir="ltr">{{ e.phone || '—' }}</td>
                    <td class="px-5 py-4 font-bold font-mono text-slate-800">{{ e.baseSalary | number:'1.2-2' }} ج.م</td>
                    <td class="px-5 py-4">
                      <span [class]="e.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                        class="px-2.5 py-1 rounded-full text-xs font-semibold">
                        {{ e.isActive ? 'على رأس العمل' : 'متوقف' }}
                      </span>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex items-center justify-center gap-2">
                        <button (click)="openAdvanceForEmployee(e)" title="صرف سلفة للموظف"
                          class="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                          سلفة
                        </button>
                        <button (click)="openEditEmployeeModal(e)" title="تعديل بيانات"
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
                    <td colspan="6" class="px-5 py-12 text-center text-slate-400">لا يوجد موظفين مسجلين</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Tab 2: Salary Advances List -->
      @if (activeTab() === 'advances') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-slate-800 text-sm">سجل السلف المالية للموظفين</h3>
            <button (click)="loadAdvances()"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
              تحديث
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-right text-sm">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                <tr>
                  <th class="px-5 py-4">اسم الموظف</th>
                  <th class="px-5 py-4">مبلغ السلفة</th>
                  <th class="px-5 py-4">تاريخ الصرف</th>
                  <th class="px-5 py-4">الحالة</th>
                  <th class="px-5 py-4">ملاحظات</th>
                  <th class="px-5 py-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (a of advances(); track a.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-4 font-bold text-slate-800">{{ a.employeeName }}</td>
                    <td class="px-5 py-4 font-bold font-mono text-purple-700">{{ a.amount | number:'1.2-2' }} ج.م</td>
                    <td class="px-5 py-4 text-slate-500 text-xs">{{ a.advanceDate | date:'yyyy/MM/dd' }}</td>
                    <td class="px-5 py-4">
                      @if (a.status === 'Pending') {
                        <span class="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          معلقة (لم تخصم)
                        </span>
                      } @else {
                        <span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          تم الخصم من الراتب
                        </span>
                      }
                    </td>
                    <td class="px-5 py-4 text-slate-500 text-xs">{{ a.notes || '—' }}</td>
                    <td class="px-5 py-4 text-center">
                      @if (a.status === 'Pending') {
                        <button (click)="confirmDeductAdvance(a)"
                          class="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors">
                          خصم الآن
                        </button>
                      } @else {
                        <span class="text-xs text-slate-400 font-medium">مكتملة</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-5 py-12 text-center text-slate-400">لا توجد سلف مسجلة</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Add/Edit Employee Modal -->
      @if (showEmployeeModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 class="text-base font-bold text-slate-800">{{ editingEmployee() ? 'تعديل موظف' : 'إضافة موظف جديد' }}</h3>
              <button (click)="showEmployeeModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">اسم الموظف *</label>
                <input [(ngModel)]="employeeForm.name" type="text"
                  placeholder="مثال: أحمد محمود"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">المسمى الوظيفي</label>
                <input [(ngModel)]="employeeForm.role" type="text"
                  placeholder="كاشير / مسؤول مخزن / مبيعات"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف</label>
                <input [(ngModel)]="employeeForm.phone" type="text"
                  placeholder="01xxxxxxxxx"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">الراتب الأساسي (ج.م) *</label>
                <input [(ngModel)]="employeeForm.baseSalary" type="number" min="0"
                  placeholder="5000"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold font-mono focus:outline-none focus:border-emerald-500 focus:bg-white">
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button (click)="showEmployeeModal.set(false)"
                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl">إلغاء</button>
              <button (click)="saveEmployee()" [disabled]="!employeeForm.name || !employeeForm.baseSalary"
                class="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-md shadow-emerald-600/20">حفظ البيانات</button>
            </div>
          </div>
        </div>
      }

      <!-- Record Salary Advance Modal -->
      @if (showAdvanceModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 class="text-base font-bold text-slate-800">صرف سلفة مالية</h3>
              <button (click)="showAdvanceModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">اختر الموظف *</label>
                <select [(ngModel)]="advanceForm.employeeId"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-purple-500">
                  <option value="">-- اختر الموظف --</option>
                  @for (e of employees(); track e.id) {
                    <option [value]="e.id">{{ e.name }} (الراتب: {{ e.baseSalary }} ج.م)</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">مبلغ السلفة (ج.م) *</label>
                <input [(ngModel)]="advanceForm.amount" type="number" min="1"
                  placeholder="0.00"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-bold font-mono text-purple-700 focus:outline-none focus:border-purple-500">
              </div>
              <div class="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <input [(ngModel)]="advanceForm.deductFromCashDrawer" id="deductDrawer" type="checkbox"
                  class="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500">
                <label for="deductDrawer" class="text-xs font-bold text-purple-900 cursor-pointer">
                  صرف المبلغ مباشرة من الخزينة اليومية (حركة خارج)
                </label>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">ملاحظات / سبب السلفة</label>
                <input [(ngModel)]="advanceForm.notes" type="text"
                  placeholder="ظرف طارئ / سلفة شهرية"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button (click)="showAdvanceModal.set(false)"
                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl">إلغاء</button>
              <button (click)="saveAdvance()" [disabled]="!advanceForm.employeeId || !advanceForm.amount || advanceForm.amount <= 0"
                class="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-xl shadow-md shadow-purple-600/20">تأكيد الصرف</button>
            </div>
          </div>
        </div>
      }

      <!-- Deduct Confirm Dialog -->
      @if (showDeductConfirm()) {
        <app-confirm-dialog
          title="تأكيد خصم السلفة"
          [message]="'هل أنت متأكد من خصم سلفة الموظف بقيمة ' + selectedAdvance()?.amount + ' ج.م من الراتب المستحق؟'"
          confirmText="نعم، تم الخصم"
          cancelText="إلغاء"
          type="warning"
          (confirm)="executeDeductAdvance()"
          (cancel)="showDeductConfirm.set(false)">
        </app-confirm-dialog>
      }
    </div>
  `
})
export class EmployeesComponent implements OnInit {
  private employeesService = inject(EmployeesService);
  private advancesService = inject(SalaryAdvancesService);
  private notification = inject(NotificationService);

  activeTab = signal<'employees' | 'advances'>('employees');
  employees = signal<EmployeeListDto[]>([]);
  advances = signal<SalaryAdvanceListDto[]>([]);
  empSearch = '';

  // Employee modal state
  showEmployeeModal = signal(false);
  editingEmployee = signal<EmployeeListDto | null>(null);
  employeeForm: CreateEmployeeDto = { name: '', role: '', phone: '', baseSalary: 0 };

  // Advance modal state
  showAdvanceModal = signal(false);
  advanceForm: RecordAdvanceDto = { employeeId: '', amount: 0, deductFromCashDrawer: true, notes: '' };

  // Deduct confirm
  showDeductConfirm = signal(false);
  selectedAdvance = signal<SalaryAdvanceListDto | null>(null);

  ngOnInit() {
    this.loadEmployees();
    this.loadAdvances();
  }

  loadEmployees() {
    this.employeesService.getAll({ search: this.empSearch || undefined }).subscribe({
      next: (res) => {
        if ((res.success || res.isSuccess) && res.data) {
          this.employees.set(res.data.items);
        }
      },
      error: () => this.notification.error('فشل تحميل قائمة الموظفين')
    });
  }

  loadAdvances() {
    this.advancesService.getAll().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.advances.set(res.data.items);
        }
      }
    });
  }

  openAddEmployeeModal() {
    this.editingEmployee.set(null);
    this.employeeForm = { name: '', role: '', phone: '', baseSalary: 0 };
    this.showEmployeeModal.set(true);
  }

  openEditEmployeeModal(e: EmployeeListDto) {
    this.editingEmployee.set(e);
    this.employeeForm = { name: e.name, role: e.role || '', phone: e.phone || '', baseSalary: e.baseSalary };
    this.showEmployeeModal.set(true);
  }

  saveEmployee() {
    if (!this.employeeForm.name || !this.employeeForm.baseSalary) return;

    if (this.editingEmployee()) {
      const dto: UpdateEmployeeDto = {
        id: this.editingEmployee()!.id,
        ...this.employeeForm
      };
      this.employeesService.update(dto.id, dto).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success('تم تعديل بيانات الموظف بنجاح');
            this.showEmployeeModal.set(false);
            this.loadEmployees();
          } else {
            this.notification.error(res.message || 'فشل التعديل');
          }
        },
        error: () => this.notification.error('حدث خطأ أثناء حفظ التعديل')
      });
    } else {
      this.employeesService.create(this.employeeForm).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success('تمت إضافة الموظف بنجاح');
            this.showEmployeeModal.set(false);
            this.loadEmployees();
          } else {
            this.notification.error(res.message || 'فشل الحفظ');
          }
        },
        error: () => this.notification.error('حدث خطأ أثناء إضافة الموظف')
      });
    }
  }

  openAdvanceModal() {
    this.advanceForm = { employeeId: '', amount: 0, deductFromCashDrawer: true, notes: '' };
    this.showAdvanceModal.set(true);
  }

  openAdvanceForEmployee(e: EmployeeListDto) {
    this.advanceForm = { employeeId: e.id, amount: 0, deductFromCashDrawer: true, notes: '' };
    this.showAdvanceModal.set(true);
  }

  saveAdvance() {
    if (!this.advanceForm.employeeId || !this.advanceForm.amount || this.advanceForm.amount <= 0) return;

    this.advancesService.record(this.advanceForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('تم صرف السلفة بنجاح وتحديث السجلات');
          this.showAdvanceModal.set(false);
          this.loadAdvances();
        } else {
          this.notification.error(res.message || 'فشل تسجيل السلفة');
        }
      },
      error: () => this.notification.error('حدث خطأ أثناء تسجيل السلفة')
    });
  }

  confirmDeductAdvance(a: SalaryAdvanceListDto) {
    this.selectedAdvance.set(a);
    this.showDeductConfirm.set(true);
  }

  executeDeductAdvance() {
    const a = this.selectedAdvance();
    if (!a) return;

    this.advancesService.deduct(a.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('تم خصم السلفة بنجاح وتحديث حالتها');
          this.showDeductConfirm.set(false);
          this.loadAdvances();
        } else {
          this.notification.error(res.message || 'فشل خصم السلفة');
        }
      },
      error: () => this.notification.error('حدث خطأ أثناء خصم السلفة')
    });
  }
}

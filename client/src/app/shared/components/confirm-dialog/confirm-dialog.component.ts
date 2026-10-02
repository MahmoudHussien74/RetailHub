import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="handleCancel()"></div>
        
        <!-- Dialog -->
        <div class="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 animate-scale-in">
          <!-- Icon -->
          <div class="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
            [class]="dialogType() === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>

          <h3 class="text-lg font-bold text-slate-800 text-center mb-1">{{ title() }}</h3>
          <p class="text-sm text-slate-500 text-center mb-6">{{ message() }}</p>

          <div class="flex gap-3">
            <button
              (click)="handleCancel()"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
              {{ cancelText() }}
            </button>
            <button
              (click)="handleConfirm()"
              class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors shadow-sm"
              [class]="dialogType() === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'">
              {{ confirmText() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in { animation: scaleIn 0.15s ease-out; }
  `]
})
export class ConfirmDialogComponent {
  readonly isOpen = input<boolean>(true);
  readonly title = input<string>('تأكيد الإجراء');
  readonly message = input<string>('هل أنت متأكد من تنفيذ هذا الإجراء؟');
  readonly confirmText = input<string>('تأكيد');
  readonly cancelText = input<string>('إلغاء');
  readonly type = input<'danger' | 'warning'>('danger');
  readonly mode = input<'danger' | 'warning' | null>(null);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();

  get dialogType(): () => 'danger' | 'warning' {
    return () => this.mode() || this.type();
  }

  handleConfirm() {
    this.confirmed.emit();
    this.confirm.emit();
  }

  handleCancel() {
    this.cancelled.emit();
    this.cancel.emit();
  }
}

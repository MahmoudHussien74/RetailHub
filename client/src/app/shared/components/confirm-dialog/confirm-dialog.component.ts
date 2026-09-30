import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="onCancel()"></div>
        
        <!-- Dialog -->
        <div class="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-scale-in">
          <!-- Icon -->
          <div class="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
            [class]="type === 'danger' ? 'bg-rose-100' : 'bg-amber-100'">
            <svg class="w-7 h-7" [class]="type === 'danger' ? 'text-rose-600' : 'text-amber-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>

          <h3 class="text-lg font-bold text-slate-800 text-center mb-1">{{ title }}</h3>
          <p class="text-sm text-slate-500 text-center mb-6">{{ message }}</p>

          <div class="flex gap-3">
            <button
              (click)="onCancel()"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
              إلغاء
            </button>
            <button
              (click)="onConfirm()"
              class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
              [class]="type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in { animation: scaleIn 0.2s ease-out; }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'تأكيد الإجراء';
  @Input() message = 'هل أنت متأكد من تنفيذ هذا الإجراء؟';
  @Input() confirmText = 'تأكيد';
  @Input() type: 'danger' | 'warning' = 'danger';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}

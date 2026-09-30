import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 left-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of notification.toasts(); track toast.id) {
        <div
          class="pointer-events-auto rounded-xl shadow-xl border px-4 py-3 flex items-start gap-3 animate-slide-in"
          [class]="getToastClasses(toast.type)">
          
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            @if (toast.type === 'success') {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            } @else if (toast.type === 'error') {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            } @else if (toast.type === 'warning') {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            } @else {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            }
          </div>

          <!-- Message -->
          <p class="text-sm font-semibold flex-1">{{ toast.message }}</p>

          <!-- Dismiss -->
          <button (click)="notification.dismiss(toast.id)" class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-in { animation: slideIn 0.3s ease-out; }
  `]
})
export class ToastContainerComponent {
  notification = inject(NotificationService);

  getToastClasses(type: string): string {
    const base = 'rounded-xl shadow-xl border px-4 py-3 flex items-start gap-3 animate-slide-in';
    switch (type) {
      case 'success': return `${base} bg-emerald-50 border-emerald-200 text-emerald-800`;
      case 'error':   return `${base} bg-rose-50 border-rose-200 text-rose-800`;
      case 'warning': return `${base} bg-amber-50 border-amber-200 text-amber-800`;
      case 'info':    return `${base} bg-blue-50 border-blue-200 text-blue-800`;
      default:        return `${base} bg-slate-50 border-slate-200 text-slate-800`;
    }
  }
}

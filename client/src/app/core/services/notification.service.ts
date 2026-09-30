import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  toasts = signal<Toast[]>([]);

  success(message: string, duration = 4000) {
    this.show('success', message, duration);
  }

  error(message: string, duration = 6000) {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 5000) {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 4000) {
    this.show('info', message, duration);
  }

  dismiss(id: number) {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  private show(type: ToastType, message: string, duration: number) {
    const id = ++this.nextId;
    this.toasts.update(toasts => [...toasts, { id, type, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}

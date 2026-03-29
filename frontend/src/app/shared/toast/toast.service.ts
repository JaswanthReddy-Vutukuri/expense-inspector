import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: { label: string; callback: () => void };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, type: Toast['type'] = 'info', action?: Toast['action']) {
    const id = this.nextId++;
    this.toasts.update(t => [...t, { id, message, type, action }]);
    setTimeout(() => this.dismiss(id), type === 'error' ? 8000 : 4000);
    return id;
  }

  success(message: string) { return this.show(message, 'success'); }
  error(message: string) { return this.show(message, 'error'); }
  info(message: string, action?: Toast['action']) { return this.show(message, 'info', action); }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}

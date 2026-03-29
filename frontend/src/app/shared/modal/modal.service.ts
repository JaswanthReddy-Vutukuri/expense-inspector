import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

interface ModalState extends ModalConfig {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  state = signal<ModalState | null>(null);

  confirm(config: ModalConfig): Promise<boolean> {
    return new Promise(resolve => {
      this.state.set({ ...config, resolve });
    });
  }

  close(result: boolean) {
    const current = this.state();
    if (current) {
      current.resolve(result);
      this.state.set(null);
    }
  }
}

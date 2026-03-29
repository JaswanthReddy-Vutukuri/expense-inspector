import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { LucideAngularModule, CheckCircle, AlertCircle, Info, X } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-up max-w-sm"
             [class]="typeClasses(toast.type)">
          <lucide-icon [name]="typeIcon(toast.type)" [size]="16" class="flex-shrink-0"></lucide-icon>
          <span class="text-sm flex-1">{{ toast.message }}</span>
          @if (toast.action) {
            <button (click)="toast.action!.callback(); toastService.dismiss(toast.id)"
                    class="text-xs font-semibold underline underline-offset-2 hover:opacity-80 flex-shrink-0">
              {{ toast.action!.label }}
            </button>
          }
          <button (click)="toastService.dismiss(toast.id)"
                  class="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">
            <lucide-icon name="x" [size]="14"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);

  typeClasses(type: string): string {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':   return 'bg-red-50 border-red-200 text-red-800';
      default:        return 'bg-ei-surface border-ei-border text-ei-text';
    }
  }

  typeIcon(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error':   return 'alert-circle';
      default:        return 'info';
    }
  }
}

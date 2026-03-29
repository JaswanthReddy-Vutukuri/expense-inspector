import { Component, inject } from '@angular/core';
import { ModalService } from './modal.service';
import { LucideAngularModule, AlertTriangle, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (modalService.state(); as modal) {
      <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="modalService.close(false)"></div>

        <!-- Modal card -->
        <div class="relative bg-ei-surface border border-ei-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
          <button (click)="modalService.close(false)"
                  class="absolute top-4 right-4 text-ei-muted hover:text-ei-text transition-colors">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>

          <div class="flex items-start gap-4">
            @if (modal.variant === 'danger') {
              <div class="w-10 h-10 rounded-full bg-ei-rose/10 flex items-center justify-center flex-shrink-0">
                <lucide-icon name="alert-triangle" [size]="20" class="text-ei-rose"></lucide-icon>
              </div>
            }
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-ei-text mb-1">{{ modal.title }}</h3>
              <p class="text-sm text-ei-subtle leading-relaxed">{{ modal.message }}</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button (click)="modalService.close(false)" class="ei-btn-secondary">
              {{ modal.cancelText || 'Cancel' }}
            </button>
            <button (click)="modalService.close(true)"
                    [class]="modal.variant === 'danger' ? 'ei-btn-danger' : 'ei-btn-primary'">
              {{ modal.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  modalService = inject(ModalService);
}

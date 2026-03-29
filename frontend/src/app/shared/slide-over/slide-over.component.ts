import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-slide-over',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (open) {
      <!-- Backdrop (mobile) -->
      <div class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
           (click)="close.emit()"></div>

      <!-- Panel -->
      <div class="fixed inset-y-0 right-0 z-[101] w-full sm:w-[420px] bg-ei-surface border-l border-ei-border
                  shadow-2xl animate-slide-right flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-ei-border">
          <h2 class="text-base font-semibold text-ei-text">{{ title }}</h2>
          <button (click)="close.emit()"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-ei-muted hover:bg-ei-bg hover:text-ei-text transition-colors">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto scrollbar-thin">
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
})
export class SlideOverComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open) this.close.emit();
  }
}

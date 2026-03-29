import { Component, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../services/auth.service';
import { AiChatComponent } from '../ai-chat/ai-chat.component';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    AiChatComponent,
  ],
  template: `
    <div class="flex h-screen overflow-hidden bg-ei-bg">
      <!-- Sidebar -->
      <aside class="flex-shrink-0 bg-ei-surface border-r border-ei-border flex flex-col transition-all duration-300 hidden md:flex"
             [class.w-56]="!sidebarCollapsed()"
             [class.w-16]="sidebarCollapsed()">
        <!-- Brand -->
        <div class="h-14 flex items-center gap-2.5 px-4 border-b border-ei-border flex-shrink-0">
          <lucide-icon name="receipt" [size]="22" class="text-ei-accent flex-shrink-0"></lucide-icon>
          @if (!sidebarCollapsed()) {
            <span class="text-sm font-semibold text-ei-text truncate">Expense Inspector</span>
          }
        </div>

        <!-- Nav -->
        <nav class="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          <p class="text-[9px] font-mono uppercase tracking-widest text-ei-muted px-2 mb-2"
             [class.hidden]="sidebarCollapsed()">Main</p>

          @for (item of mainNav; track item.route) {
            <a [routerLink]="item.route"
               routerLinkActive="bg-ei-accent/10 text-ei-accent border-l-[3px] border-ei-accent"
               [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
               class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ei-subtle
                      hover:bg-ei-bg hover:text-ei-text transition-all duration-200
                      border-l-[3px] border-transparent"
               [class.justify-center]="sidebarCollapsed()"
               [class.px-0]="sidebarCollapsed()"
               [title]="sidebarCollapsed() ? item.label : ''">
              <lucide-icon [name]="item.icon" [size]="18" class="flex-shrink-0"></lucide-icon>
              @if (!sidebarCollapsed()) {
                <span>{{ item.label }}</span>
              }
            </a>
          }

          <div class="h-px bg-ei-border my-3 mx-2"></div>
          <p class="text-[9px] font-mono uppercase tracking-widest text-ei-muted px-2 mb-2"
             [class.hidden]="sidebarCollapsed()">Tools</p>

          @for (item of toolNav; track item.route) {
            <a [routerLink]="item.route"
               routerLinkActive="bg-ei-accent/10 text-ei-accent border-l-[3px] border-ei-accent"
               class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ei-subtle
                      hover:bg-ei-bg hover:text-ei-text transition-all duration-200
                      border-l-[3px] border-transparent"
               [class.justify-center]="sidebarCollapsed()"
               [class.px-0]="sidebarCollapsed()"
               [title]="sidebarCollapsed() ? item.label : ''">
              <lucide-icon [name]="item.icon" [size]="18" class="flex-shrink-0"></lucide-icon>
              @if (!sidebarCollapsed()) {
                <span>{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <!-- Bottom section -->
        <div class="border-t border-ei-border p-2 space-y-1">
          <!-- User -->
          @if (authService.currentUser(); as user) {
            <div class="flex items-center gap-2.5 px-2 py-2 rounded-lg"
                 [class.justify-center]="sidebarCollapsed()">
              <div class="w-8 h-8 rounded-full bg-ei-accent/10 flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-semibold text-ei-accent">{{ userInitials() }}</span>
              </div>
              @if (!sidebarCollapsed()) {
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-ei-text truncate">{{ user.fullName }}</p>
                  <p class="text-[10px] text-ei-muted truncate">{{ user.email }}</p>
                </div>
              }
            </div>
          }

          <!-- Logout -->
          <button (click)="authService.logout()"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ei-subtle
                         hover:bg-ei-rose/10 hover:text-ei-rose transition-colors duration-200"
                  [class.justify-center]="sidebarCollapsed()"
                  [title]="sidebarCollapsed() ? 'Logout' : ''">
            <lucide-icon name="log-out" [size]="16" class="flex-shrink-0"></lucide-icon>
            @if (!sidebarCollapsed()) {
              <span>Logout</span>
            }
          </button>

          <!-- Collapse toggle -->
          <button (click)="toggleSidebar()"
                  class="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-ei-muted
                         hover:bg-ei-bg hover:text-ei-text transition-colors duration-200"
                  [class.justify-center]="sidebarCollapsed()">
            <lucide-icon [name]="sidebarCollapsed() ? 'panel-left-open' : 'panel-left-close'" [size]="14" class="flex-shrink-0"></lucide-icon>
            @if (!sidebarCollapsed()) {
              <span>Collapse</span>
            }
          </button>
        </div>
      </aside>

      <!-- Mobile sidebar backdrop -->
      @if (mobileSidebarOpen()) {
        <div class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" (click)="mobileSidebarOpen.set(false)"></div>
      }

      <!-- Mobile sidebar drawer -->
      @if (mobileSidebarOpen()) {
        <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-ei-surface border-r border-ei-border flex flex-col md:hidden animate-slide-right">
          <div class="h-14 flex items-center justify-between px-4 border-b border-ei-border">
            <div class="flex items-center gap-2.5">
              <lucide-icon name="receipt" [size]="22" class="text-ei-accent"></lucide-icon>
              <span class="text-sm font-semibold text-ei-text">Expense Inspector</span>
            </div>
            <button (click)="mobileSidebarOpen.set(false)" class="text-ei-muted hover:text-ei-text">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>
          <nav class="flex-1 py-3 px-2 space-y-0.5">
            @for (item of allNav; track item.route) {
              <a [routerLink]="item.route"
                 routerLinkActive="bg-ei-accent/10 text-ei-accent"
                 (click)="mobileSidebarOpen.set(false)"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ei-subtle hover:bg-ei-bg hover:text-ei-text transition-colors">
                <lucide-icon [name]="item.icon" [size]="18"></lucide-icon>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
          <div class="border-t border-ei-border p-3">
            <button (click)="authService.logout()"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ei-subtle hover:bg-ei-rose/10 hover:text-ei-rose transition-colors">
              <lucide-icon name="log-out" [size]="16"></lucide-icon>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      }

      <!-- Main content area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Header bar -->
        <header class="h-14 flex items-center justify-between px-4 md:px-6 border-b border-ei-border bg-ei-surface/80 backdrop-blur-sm flex-shrink-0 z-10">
          <div class="flex items-center gap-3">
            <!-- Mobile hamburger -->
            <button (click)="mobileSidebarOpen.set(true)" class="md:hidden text-ei-subtle hover:text-ei-text">
              <lucide-icon name="menu" [size]="20"></lucide-icon>
            </button>
            <!-- Breadcrumb -->
            <nav class="flex items-center gap-1.5 text-sm">
              <span class="text-ei-muted">Expense Inspector</span>
              <lucide-icon name="chevron-right" [size]="14" class="text-ei-border"></lucide-icon>
              <span class="font-medium text-ei-text">{{ currentPageTitle() }}</span>
            </nav>
          </div>

          <div class="flex items-center gap-2">
            @if (authService.currentUser(); as user) {
              <span class="hidden sm:block text-xs text-ei-muted mr-1">{{ user.fullName }}</span>
            }
            <a routerLink="/expenses/new" class="ei-btn-primary text-xs py-2 px-3">
              <lucide-icon name="plus" [size]="14"></lucide-icon>
              <span class="hidden sm:inline">New Expense</span>
            </a>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto scrollbar-thin">
          <div class="p-4 md:p-6 animate-fade-in">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- AI Chat Panel (right) -->
      @if (chatOpen()) {
        <!-- Backdrop -->
        <div class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" (click)="chatOpen.set(false)"></div>
        <!-- Panel -->
        <div class="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] lg:static lg:z-auto lg:w-[380px]
                    flex-shrink-0 border-l border-ei-dark-b animate-slide-right">
          <app-ai-chat (closePanel)="chatOpen.set(false)"></app-ai-chat>
        </div>
      }
    </div>

    <!-- AI Assistant FAB (bottom-right, hidden when chat is open) -->
    @if (!chatOpen()) {
      <button (click)="chatOpen.set(true)"
              class="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full shadow-lg
                     bg-ei-accent text-white hover:bg-ei-accent-d
                     flex items-center justify-center transition-all duration-200
                     hover:scale-105 active:scale-95"
              title="AI Assistant">
        <lucide-icon name="sparkles" [size]="20"></lucide-icon>
        <span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-ei-emerald border-2 border-ei-bg animate-pulse"></span>
      </button>
    }
  `,
  styles: []
})
export class LayoutComponent {
  sidebarCollapsed = signal(localStorage.getItem('ei-sidebar-collapsed') === 'true');
  chatOpen = signal(false);
  mobileSidebarOpen = signal(false);

  mainNav = [
    { route: '/dashboard', icon: 'layout-dashboard', label: 'Overview' },
    { route: '/expenses', icon: 'receipt', label: 'Expenses' },
  ];

  toolNav = [
    { route: '/debug', icon: 'terminal', label: 'Debug' },
  ];

  allNav = [...this.mainNav, ...this.toolNav];

  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  currentPageTitle = computed(() => {
    const url = this.url();
    if (url.includes('/dashboard')) return 'Overview';
    if (url.includes('/expenses/new')) return 'New Expense';
    if (url.includes('/expenses/edit')) return 'Edit Expense';
    if (url.includes('/expenses')) return 'Expenses';
    if (url.includes('/debug')) return 'Debug';
    return 'Overview';
  });

  userInitials = computed(() => {
    const name = this.authService.currentUser()?.fullName || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  constructor(public authService: AuthService, private router: Router) {}

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
    localStorage.setItem('ei-sidebar-collapsed', String(this.sidebarCollapsed()));
  }
}

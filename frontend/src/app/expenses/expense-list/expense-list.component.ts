import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, ChevronUp, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight, Search, Receipt, X } from 'lucide-angular';
import { Expense } from '../../models/expense.model';
import { ExpenseService } from '../../services/expense.service';
import { ModalService } from '../../shared/modal/modal.service';
import { ToastService } from '../../shared/toast/toast.service';
import { getCategoryColor } from '../../shared/constants/category-colors';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-5xl mx-auto space-y-5 animate-fade-in">
      <!-- Header -->
      <div>
        <p class="section-label">Manage</p>
        <h1 class="text-2xl font-bold text-ei-text">Expenses</h1>
      </div>

      <!-- Filter bar -->
      <div class="card p-3">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1 min-w-[200px]">
            <lucide-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-ei-muted"></lucide-icon>
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()"
                   class="ei-input pl-10 py-2" placeholder="Search expenses...">
          </div>
          <!-- Category chips -->
          <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button (click)="filterCategory = ''; loadExpenses()"
                    class="px-2.5 py-1 text-xs rounded-full border whitespace-nowrap transition-colors"
                    [class]="!filterCategory
                      ? 'bg-ei-accent text-white border-ei-accent'
                      : 'border-ei-border text-ei-subtle hover:border-ei-accent/40'">
              All
            </button>
            @for (cat of categories; track cat.id) {
              <button (click)="filterCategory = cat.name; loadExpenses()"
                      class="px-2.5 py-1 text-xs rounded-full border whitespace-nowrap transition-colors"
                      [class]="filterCategory === cat.name
                        ? 'bg-ei-accent text-white border-ei-accent'
                        : 'border-ei-border text-ei-subtle hover:border-ei-accent/40'">
                {{ cat.name }}
              </button>
            }
          </div>
          <!-- Count -->
          <span class="text-xs text-ei-muted font-mono whitespace-nowrap">{{ total }} results</span>
        </div>
      </div>

      <!-- Table -->
      @if (filteredExpenses.length > 0) {
        <div class="card p-0 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-ei-border bg-ei-bg/50">
                  <th class="px-4 py-3 text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider cursor-pointer select-none hover:text-ei-text transition-colors"
                      (click)="toggleSort('date')">
                    <span class="inline-flex items-center gap-1">
                      Date
                      @if (sortBy === 'date') {
                        <lucide-icon [name]="sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="12"></lucide-icon>
                      }
                    </span>
                  </th>
                  <th class="px-4 py-3 text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider">Description</th>
                  <th class="px-4 py-3 text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider">Category</th>
                  <th class="px-4 py-3 text-right text-[10px] font-mono text-ei-muted uppercase tracking-wider cursor-pointer select-none hover:text-ei-text transition-colors"
                      (click)="toggleSort('amount')">
                    <span class="inline-flex items-center gap-1 justify-end">
                      Amount
                      @if (sortBy === 'amount') {
                        <lucide-icon [name]="sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="12"></lucide-icon>
                      }
                    </span>
                  </th>
                  <th class="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                @for (exp of filteredExpenses; track exp.id) {
                  <tr class="border-b border-ei-border/50 hover:bg-ei-bg/50 transition-colors group">
                    <td class="px-4 py-3 text-ei-subtle font-mono text-xs">{{ exp.date | date:'mediumDate' }}</td>
                    <td class="px-4 py-3 text-ei-text font-medium">{{ exp.description }}</td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border"
                            [class]="getCatBadgeClasses(exp.category_name || 'Other')">
                        <span class="w-1.5 h-1.5 rounded-full" [class]="getCatDot(exp.category_name || 'Other')"></span>
                        {{ exp.category_name }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-mono font-semibold text-ei-text">{{ exp.amount | currency }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <a [routerLink]="['edit', exp.id]"
                           class="w-7 h-7 rounded-md flex items-center justify-center text-ei-muted hover:bg-ei-accent/10 hover:text-ei-accent transition-colors">
                          <lucide-icon name="pencil" [size]="13"></lucide-icon>
                        </a>
                        <button (click)="deleteExpense(exp); $event.stopPropagation()"
                                class="w-7 h-7 rounded-md flex items-center justify-center text-ei-muted hover:bg-ei-rose/10 hover:text-ei-rose transition-colors">
                          <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-ei-border bg-ei-bg/30">
            <span class="text-[10px] text-ei-muted font-mono">
              {{ pageIndex * pageSize + 1 }}–{{ minVal((pageIndex + 1) * pageSize, total) }} of {{ total }}
            </span>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1">
                @for (size of [10, 25, 50]; track size) {
                  <button (click)="changePageSize(size)"
                          class="px-2 py-0.5 text-[10px] rounded font-mono transition-colors"
                          [class]="pageSize === size ? 'bg-ei-accent text-white' : 'text-ei-muted hover:text-ei-text'">
                    {{ size }}
                  </button>
                }
              </div>
              <div class="flex items-center gap-1.5">
                <button (click)="prevPage()" [disabled]="pageIndex === 0"
                        class="w-7 h-7 rounded-md flex items-center justify-center border border-ei-border text-ei-subtle
                               hover:border-ei-accent/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <lucide-icon name="chevron-left" [size]="14"></lucide-icon>
                </button>
                <span class="text-[10px] font-mono text-ei-subtle min-w-[60px] text-center">
                  {{ pageIndex + 1 }} / {{ totalPages }}
                </span>
                <button (click)="nextPage()" [disabled]="(pageIndex + 1) * pageSize >= total"
                        class="w-7 h-7 rounded-md flex items-center justify-center border border-ei-border text-ei-subtle
                               hover:border-ei-accent/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <lucide-icon name="chevron-right" [size]="14"></lucide-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- Empty state -->
        <div class="card flex flex-col items-center py-16 text-center">
          <div class="w-14 h-14 rounded-2xl bg-ei-accent/10 flex items-center justify-center mb-4">
            <lucide-icon name="receipt" [size]="28" class="text-ei-accent"></lucide-icon>
          </div>
          <h3 class="text-lg font-semibold text-ei-text mb-1">No expenses yet</h3>
          <p class="text-sm text-ei-muted mb-6">Start tracking by adding your first expense</p>
          <a routerLink="new" class="ei-btn-primary">
            <lucide-icon name="plus" [size]="16"></lucide-icon>
            Add Expense
          </a>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ExpenseListComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private modalService = inject(ModalService);
  private toastService = inject(ToastService);

  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  categories: { id: number; name: string }[] = [];
  total = 0;
  pageSize = 10;
  pageIndex = 0;
  sortBy = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchQuery = '';
  filterCategory = '';

  get totalPages() {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnInit() {
    this.loadExpenses();
    this.expenseService.getCategories().subscribe(cats => this.categories = cats);
  }

  loadExpenses() {
    this.expenseService.getExpenses(this.pageIndex, this.pageSize, this.sortBy, this.sortOrder).subscribe(response => {
      this.expenses = response.data;
      this.total = response.total;
      this.applyClientFilters();
    });
  }

  applyClientFilters() {
    let filtered = [...this.expenses];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.description.toLowerCase().includes(q));
    }
    if (this.filterCategory) {
      filtered = filtered.filter(e => e.category_name === this.filterCategory);
    }
    this.filteredExpenses = filtered;
  }

  onSearch() {
    this.applyClientFilters();
  }

  toggleSort(column: string) {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.pageIndex = 0;
    this.loadExpenses();
  }

  prevPage() {
    if (this.pageIndex > 0) { this.pageIndex--; this.loadExpenses(); }
  }

  nextPage() {
    if ((this.pageIndex + 1) * this.pageSize < this.total) { this.pageIndex++; this.loadExpenses(); }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.pageIndex = 0;
    this.loadExpenses();
  }

  async deleteExpense(expense: Expense) {
    const confirmed = await this.modalService.confirm({
      title: 'Delete Expense',
      message: `Are you sure you want to delete "${expense.description}"?`,
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (confirmed && expense.id) {
      this.expenseService.deleteExpense(expense.id).subscribe(() => {
        this.toastService.success('Expense deleted');
        this.loadExpenses();
      });
    }
  }

  getCatDot(name: string): string {
    return getCategoryColor(name).dot;
  }

  getCatBadgeClasses(name: string): string {
    const c = getCategoryColor(name);
    return `${c.bg} ${c.text} border-transparent`;
  }

  minVal(a: number, b: number) {
    return Math.min(a, b);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { LucideAngularModule, TrendingUp, TrendingDown, Calculator, Tag, Wallet, ArrowRight } from 'lucide-angular';
import { ExpenseService } from '../services/expense.service';
import { ExpenseSummary } from '../models/expense.model';
import { CHART_COLORS, getCategoryColor } from '../shared/constants/category-colors';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, LucideAngularModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <!-- Header -->
      <div>
        <p class="section-label">Overview</p>
        <h1 class="text-2xl font-bold text-ei-text">Financial Overview</h1>
      </div>

      <!-- KPI Strip -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- This Month -->
        <div class="card">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[10px] font-mono text-ei-muted uppercase tracking-wider">This Month</p>
              <p class="text-2xl font-bold text-ei-text font-mono mt-1">{{ summary?.month_spent | currency }}</p>
            </div>
            <div class="w-9 h-9 rounded-lg bg-ei-accent/10 flex items-center justify-center flex-shrink-0">
              <lucide-icon name="trending-up" [size]="18" class="text-ei-accent"></lucide-icon>
            </div>
          </div>
          @if (summary && expenseCount > 0) {
            <p class="text-[10px] text-ei-muted mt-2">{{ expenseCount }} expenses this month</p>
          }
        </div>

        <!-- Average per Expense -->
        <div class="card">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[10px] font-mono text-ei-muted uppercase tracking-wider">Avg / Expense</p>
              <p class="text-2xl font-bold text-ei-text font-mono mt-1">{{ avgPerExpense | currency }}</p>
            </div>
            <div class="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <lucide-icon name="calculator" [size]="18" class="text-ei-accent"></lucide-icon>
            </div>
          </div>
          @if (expenseCount > 0) {
            <p class="text-[10px] text-ei-muted mt-2">across {{ expenseCount }} expenses</p>
          }
        </div>

        <!-- Top Category -->
        <div class="card">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[10px] font-mono text-ei-muted uppercase tracking-wider">Top Category</p>
              <p class="text-xl font-bold text-ei-text mt-1">{{ topCategory?.name || '—' }}</p>
            </div>
            <div class="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <lucide-icon name="tag" [size]="18" class="text-ei-amber"></lucide-icon>
            </div>
          </div>
          @if (topCategory) {
            <p class="text-[10px] text-ei-muted mt-2">{{ topCategory.total | currency }} · {{ topCategoryPct }}% of total</p>
          }
        </div>

        <!-- Total All Time -->
        <div class="card">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[10px] font-mono text-ei-muted uppercase tracking-wider">All Time</p>
              <p class="text-2xl font-bold text-ei-text font-mono mt-1">{{ summary?.total_spent | currency }}</p>
            </div>
            <div class="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <lucide-icon name="wallet" [size]="18" class="text-ei-emerald"></lucide-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart + Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Category Breakdown -->
        <div class="lg:col-span-2 card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="section-label">Breakdown</p>
              <h2 class="text-base font-semibold text-ei-text">Spending by Category</h2>
            </div>
          </div>

          @if (summary?.category_breakdown?.length) {
            <!-- Horizontal bars -->
            <div class="space-y-3 mb-6">
              @for (cat of summary!.category_breakdown; track cat.name) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" [class]="getCatDot(cat.name)"></span>
                      <span class="text-sm text-ei-text">{{ cat.name }}</span>
                      <span class="text-[10px] text-ei-muted font-mono">{{ cat.count }} txns</span>
                    </div>
                    <span class="text-sm font-mono font-semibold text-ei-text">{{ cat.total | currency }}</span>
                  </div>
                  <div class="w-full bg-ei-bg rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-500"
                         [class]="getCatDot(cat.name)"
                         [style.width.%]="getBarWidth(cat.total)">
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Pie chart -->
            <div class="relative h-64 w-64 mx-auto">
              <canvas baseChart
                [data]="pieChartData"
                [options]="pieChartOptions"
                [type]="pieChartType">
              </canvas>
            </div>
          } @else {
            <div class="flex flex-col items-center py-12 text-center">
              <p class="text-sm text-ei-muted">No expense data yet</p>
              <a routerLink="/expenses/new" class="text-sm text-ei-accent hover:text-ei-accent-d mt-2">Add your first expense</a>
            </div>
          }
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="section-label">Activity</p>
              <h2 class="text-base font-semibold text-ei-text">Recent</h2>
            </div>
            <a routerLink="/expenses" class="text-xs text-ei-accent hover:text-ei-accent-d flex items-center gap-1 transition-colors">
              View all
              <lucide-icon name="arrow-right" [size]="12"></lucide-icon>
            </a>
          </div>

          @if (recentExpenses.length > 0) {
            <div class="space-y-1">
              @for (exp of recentExpenses; track exp.id) {
                <div class="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-ei-bg transition-colors">
                  <span class="w-2 h-2 rounded-full flex-shrink-0" [class]="getCatDot(exp.category_name || 'Other')"></span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-ei-text truncate">{{ exp.description }}</p>
                    <p class="text-[10px] text-ei-muted font-mono">{{ exp.date | date:'mediumDate' }}</p>
                  </div>
                  <span class="text-sm font-mono font-semibold text-ei-text flex-shrink-0">{{ exp.amount | currency }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-ei-muted py-8 text-center">No recent expenses</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  summary?: ExpenseSummary;
  recentExpenses: any[] = [];
  expenseCount = 0;
  avgPerExpense = 0;
  topCategory: { name: string; total: number; count: number } | null = null;
  topCategoryPct = 0;
  private maxCategoryTotal = 0;

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { family: 'Inter', size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed as number;
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
            return ` ${ctx.label}: $${val.toFixed(2)} (${((val / total) * 100).toFixed(1)}%)`;
          }
        }
      }
    }
  };

  public pieChartData: ChartData<'pie', number[], string | string[]> = { labels: [], datasets: [{ data: [] }] };
  public pieChartType: ChartType = 'pie';

  constructor(private expenseService: ExpenseService) {}

  ngOnInit() {
    this.expenseService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.recentExpenses = summary.recent_expenses || [];

        if (summary.category_breakdown?.length) {
          this.maxCategoryTotal = Math.max(...summary.category_breakdown.map(c => c.total));
          this.expenseCount = summary.category_breakdown.reduce((sum, c) => sum + c.count, 0);
          this.avgPerExpense = this.expenseCount > 0 ? summary.month_spent / this.expenseCount : 0;

          const sorted = [...summary.category_breakdown].sort((a, b) => b.total - a.total);
          this.topCategory = sorted[0] || null;
          this.topCategoryPct = summary.total_spent > 0
            ? Math.round((this.topCategory!.total / summary.total_spent) * 100)
            : 0;

          this.pieChartData = {
            labels: summary.category_breakdown.map(c => c.name),
            datasets: [{
              data: summary.category_breakdown.map(c => c.total),
              backgroundColor: CHART_COLORS.slice(0, summary.category_breakdown.length),
              borderWidth: 0,
            }]
          };
        }
      },
      error: () => {
        this.summary = { total_spent: 0, month_spent: 0, category_breakdown: [] };
      }
    });
  }

  getCatDot(name: string): string {
    return getCategoryColor(name).dot;
  }

  getBarWidth(total: number): number {
    return this.maxCategoryTotal > 0 ? (total / this.maxCategoryTotal) * 100 : 0;
  }
}

import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ExpenseService } from '../../services/expense.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="max-w-2xl mx-auto animate-fade-in">
      <div class="mb-6">
        <p class="section-label">{{ isEdit ? 'Edit' : 'Create' }}</p>
        <h1 class="text-2xl font-bold text-ei-text">{{ isEdit ? 'Edit' : 'New' }} Expense</h1>
      </div>

      <div class="card">
        <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-mono text-ei-subtle mb-1.5 block">Title</label>
              <input type="text" formControlName="title" class="ei-input" placeholder="Expense title">
              @if (expenseForm.get('title')?.touched && expenseForm.get('title')?.hasError('required')) {
                <p class="text-xs text-ei-rose mt-1">Title is required</p>
              }
            </div>

            <div>
              <label class="text-xs font-mono text-ei-subtle mb-1.5 block">Amount</label>
              <input type="number" formControlName="amount" class="ei-input" placeholder="0.00" step="0.01">
              @if (expenseForm.get('amount')?.touched && expenseForm.get('amount')?.hasError('required')) {
                <p class="text-xs text-ei-rose mt-1">Amount is required</p>
              }
            </div>

            <div>
              <label class="text-xs font-mono text-ei-subtle mb-1.5 block">Category</label>
              <select formControlName="category" class="ei-select">
                <option value="" disabled>Select category</option>
                @for (cat of categories; track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
              @if (expenseForm.get('category')?.touched && expenseForm.get('category')?.hasError('required')) {
                <p class="text-xs text-ei-rose mt-1">Category is required</p>
              }
            </div>

            <div>
              <label class="text-xs font-mono text-ei-subtle mb-1.5 block">Date</label>
              <input type="date" formControlName="date" class="ei-input">
              @if (expenseForm.get('date')?.touched && expenseForm.get('date')?.hasError('required')) {
                <p class="text-xs text-ei-rose mt-1">Date is required</p>
              }
            </div>
          </div>

          <div>
            <label class="text-xs font-mono text-ei-subtle mb-1.5 block">Description (Optional)</label>
            <textarea formControlName="description" rows="3" class="ei-input" placeholder="Add notes..."></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <a routerLink="/expenses" class="ei-btn-secondary">Cancel</a>
            <button type="submit" [disabled]="expenseForm.invalid || loading" class="ei-btn-primary">
              {{ loading ? 'Saving...' : 'Save Expense' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class ExpenseFormComponent implements OnInit {
  expenseForm: FormGroup;
  isEdit = false;
  id?: number;
  loading = false;
  categories: { id: number; name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.expenseForm = this.fb.group({
      title: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      date: [this.formatDate(new Date()), Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.expenseService.getCategories().subscribe(categories => {
      this.categories = categories;
    });

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      this.id = +idParam;
      this.isEdit = true;
      this.expenseService.getExpenseById(this.id).subscribe(expense => {
        this.expenseForm.patchValue({
          title: expense.description,
          amount: expense.amount,
          category: expense.category_id,
          date: expense.date.split('T')[0],
          description: expense.description
        });
      });
    }
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      this.loading = true;
      const fv = this.expenseForm.value;

      const apiPayload = {
        amount: fv.amount,
        category_id: fv.category,
        description: fv.title + (fv.description ? ': ' + fv.description : ''),
        date: fv.date
      };

      const obs = this.isEdit && this.id
        ? this.expenseService.updateExpense(this.id, apiPayload as any)
        : this.expenseService.createExpense(apiPayload as any);

      obs.subscribe({
        next: () => {
          this.toastService.success(this.isEdit ? 'Expense updated' : 'Expense created');
          this.router.navigate(['/expenses']);
        },
        error: () => this.loading = false
      });
    }
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

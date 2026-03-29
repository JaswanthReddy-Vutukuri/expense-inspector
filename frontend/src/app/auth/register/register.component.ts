import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Receipt } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-ei-bg px-4">
      <div class="w-full max-w-md animate-fade-in">
        <!-- Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2.5 mb-3">
            <div class="w-10 h-10 rounded-xl bg-ei-accent/10 flex items-center justify-center">
              <lucide-icon name="receipt" [size]="22" class="text-ei-accent"></lucide-icon>
            </div>
          </div>
          <h1 class="text-2xl font-bold text-ei-text">Expense Inspector</h1>
          <p class="section-label mt-2">Create your account</p>
        </div>

        <!-- Card -->
        <div class="card">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="text-xs font-mono text-ei-subtle mb-1.5 block">Full Name</label>
              <input type="text" formControlName="fullName" class="ei-input" placeholder="John Doe" autocomplete="name">
              @if (registerForm.get('fullName')?.touched && registerForm.get('fullName')?.hasError('required')) {
                <p class="text-xs text-ei-rose mt-1">Name is required</p>
              }
            </div>

            <div>
              <label class="text-xs font-mono text-ei-subtle mb-1.5 block">Email</label>
              <input type="email" formControlName="email" class="ei-input" placeholder="you&#64;example.com" autocomplete="email">
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.hasError('required')) {
                <p class="text-xs text-ei-rose mt-1">Email is required</p>
              }
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.hasError('email')) {
                <p class="text-xs text-ei-rose mt-1">Please enter a valid email</p>
              }
            </div>

            <div>
              <label class="text-xs font-mono text-ei-subtle mb-1.5 block">Password</label>
              <input type="password" formControlName="password" class="ei-input" placeholder="Min 6 characters" autocomplete="new-password">
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('required')) {
                <p class="text-xs text-ei-rose mt-1">Password is required</p>
              }
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('minlength')) {
                <p class="text-xs text-ei-rose mt-1">Minimum 6 characters</p>
              }
            </div>

            <button type="submit" [disabled]="registerForm.invalid || loading" class="ei-btn-primary w-full">
              {{ loading ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>

          <p class="text-center text-sm text-ei-muted mt-6">
            Already have an account?
            <a routerLink="/auth/login" class="text-ei-accent hover:text-ei-accent-d font-medium transition-colors">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      const formValue = this.registerForm.value;
      this.authService.register({ email: formValue.email, password: formValue.password, name: formValue.fullName }).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.loading = false
      });
    }
  }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <i class="logo-icon">🏪</i>
          </div>
          <h1>RetailHub</h1>
          <p>نظام إدارة المبيعات والمخزون</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          @if (errorMsg()) {
            <div class="error-alert">
              <span>⚠️</span>
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <div class="form-group">
            <label for="username">اسم المستخدم</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                id="username"
                type="text"
                [(ngModel)]="username"
                name="username"
                placeholder="أدخل اسم المستخدم"
                [disabled]="loading()"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">كلمة المرور</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="أدخل كلمة المرور"
                [disabled]="loading()"
                autocomplete="current-password"
                required
              />
              <button type="button" class="toggle-password" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <button type="submit" class="login-btn" [disabled]="loading() || !username || !password">
            @if (loading()) {
              <span class="spinner"></span>
              <span>جاري تسجيل الدخول...</span>
            } @else {
              <span>تسجيل الدخول</span>
            }
          </button>
        </form>

        <div class="login-footer">
          <p>RetailHub © {{ currentYear }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      padding: 1rem;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
    }

    .login-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      font-size: 2rem;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
    }

    .login-header h1 {
      color: #fff;
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
    }

    .login-header p {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
      margin: 0;
    }

    .error-alert {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      color: #fca5a5;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      animation: shake 0.4s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      right: 14px;
      font-size: 1rem;
      pointer-events: none;
      z-index: 1;
    }

    .input-wrapper input {
      width: 100%;
      padding: 0.85rem 2.75rem 0.85rem 2.75rem;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      color: #fff;
      font-size: 0.95rem;
      transition: all 0.2s;
      outline: none;
      font-family: inherit;
    }

    .input-wrapper input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .input-wrapper input:focus {
      border-color: #6366f1;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    .input-wrapper input:disabled {
      opacity: 0.5;
    }

    .toggle-password {
      position: absolute;
      left: 10px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 4px;
    }

    .login-btn {
      width: 100%;
      padding: 0.9rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      font-family: inherit;
    }

    .login-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
    }

    .login-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .login-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
    }

    .login-footer p {
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.8rem;
      margin: 0;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');
  showPassword = signal(false);
  currentYear = new Date().getFullYear();

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    // If already authenticated, redirect to dashboard
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin() {
    if (!this.username || !this.password) return;

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.username, this.password).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMsg.set(res.message || 'فشل تسجيل الدخول');
        }
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'خطأ في الاتصال بالسيرفر');
      }
    });
  }
}

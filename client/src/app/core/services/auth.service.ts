import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Observable, tap, of } from 'rxjs';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  fullName: string;
  username: string;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const TOKEN_KEY = 'retailhub_token';
const REFRESH_KEY = 'retailhub_refresh';
const USER_KEY = 'retailhub_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<UserInfo | null>(this.loadUser());
  private readonly _isRefreshing = signal(false);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? '');
  readonly fullName = computed(() => this._user()?.fullName ?? '');

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  login(username: string, password: string): Observable<ApiResponse<AuthResult>> {
    return this.api.post<ApiResponse<AuthResult>>('Auth/login', { username, password }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.saveTokens(res.data);
        }
      })
    );
  }

  refreshToken(): Observable<ApiResponse<AuthResult>> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      this.logout();
      return of({ success: false, message: 'No tokens' });
    }

    this._isRefreshing.set(true);
    return this.api.post<ApiResponse<AuthResult>>('Auth/refresh', { accessToken, refreshToken }).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.saveTokens(res.data);
          } else {
            this.logout();
          }
          this._isRefreshing.set(false);
        },
        error: () => {
          this.logout();
          this._isRefreshing.set(false);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  isRefreshing(): boolean {
    return this._isRefreshing();
  }

  hasRole(role: string): boolean {
    return this._user()?.role === role;
  }

  private saveTokens(authResult: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, authResult.accessToken);
    localStorage.setItem(REFRESH_KEY, authResult.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authResult.user));
    this._user.set(authResult.user);
  }

  private loadUser(): UserInfo | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Skip auth header for login/refresh endpoints
  if (req.url.includes('/Auth/login') || req.url.includes('/Auth/refresh')) {
    return next(req);
  }

  const token = auth.getAccessToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !auth.isRefreshing() && !req.url.includes('/Auth/')) {
        // Try to refresh the token
        return auth.refreshToken().pipe(
          switchMap(res => {
            if (res.success && res.data) {
              // Retry the original request with new token
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.data.accessToken}` }
              });
              return next(retryReq);
            }
            return throwError(() => error);
          }),
          catchError(() => {
            auth.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

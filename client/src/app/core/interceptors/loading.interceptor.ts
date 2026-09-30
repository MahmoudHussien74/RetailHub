import { HttpInterceptorFn } from '@angular/common/http';
import { signal } from '@angular/core';
import { finalize } from 'rxjs';

/** Global loading signal — use in topbar loading bar */
export const isLoading = signal(false);
let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  activeRequests++;
  isLoading.set(true);

  return next(req).pipe(
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        isLoading.set(false);
      }
    })
  );
};

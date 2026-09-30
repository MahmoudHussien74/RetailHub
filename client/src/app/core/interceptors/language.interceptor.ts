import { HttpInterceptorFn } from '@angular/common/http';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const lang = localStorage.getItem('rh_language') || 'ar';
  const cloned = req.clone({
    setHeaders: { 'Accept-Language': lang }
  });
  return next(cloned);
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError(error => {
      let message = 'حدث خطأ غير متوقع';

      if (error.status === 0) {
        message = 'لا يمكن الاتصال بالسيرفر — تأكد من تشغيل الـ API';
      } else if (error.status === 400) {
        // Validation errors
        if (error.error?.errors && Array.isArray(error.error.errors)) {
          message = error.error.errors.join(' | ');
        } else if (error.error?.message) {
          message = error.error.message;
        } else {
          message = 'بيانات غير صالحة — تأكد من المدخلات';
        }
      } else if (error.status === 401) {
        message = 'انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى';
      } else if (error.status === 403) {
        message = 'ليس لديك صلاحية لتنفيذ هذا الإجراء';
      } else if (error.status === 404) {
        message = error.error?.message || 'العنصر المطلوب غير موجود';
      } else if (error.status === 409) {
        message = error.error?.message || 'تعارض في البيانات — ربما تم تعديلها من مكان آخر';
      } else if (error.status >= 500) {
        message = 'خطأ في السيرفر — يرجى المحاولة لاحقاً';
      }

      notification.error(message);
      return throwError(() => error);
    })
  );
};

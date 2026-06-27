import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';
import { parseApiError } from '../utils/api-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 404 is handled locally by components (empty state, redirect).
      if (err.status === 404) return throwError(() => err);

      const message = parseApiError(err, 'Unexpected error. Please try again.');

      if (err.status >= 500) {
        notify.error('Server unavailable. Please try again.');
      } else if (err.status > 0) {
        notify.error(message);
      }

      return throwError(() => err);
    }),
  );
};

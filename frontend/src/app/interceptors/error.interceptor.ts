import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../shared/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred!';

      if (error.status === 401) {
        authService.logout();
        errorMessage = 'Session expired. Please login again.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      toast.error(errorMessage);
      return throwError(() => error);
    })
  );
};

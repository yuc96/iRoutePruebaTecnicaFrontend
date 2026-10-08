import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStore } from '../storage/token.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).snapshot;
  if (!token || req.url.includes('/api/auth/login')) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};

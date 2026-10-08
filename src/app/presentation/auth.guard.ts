import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStore } from '../infrastructure/storage/token.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(TokenStore);
  const router = inject(Router);
  return store.snapshot ? true : router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = () => {
  const store = inject(TokenStore);
  const router = inject(Router);
  return store.snapshot ? router.parseUrl('/') : true;
};

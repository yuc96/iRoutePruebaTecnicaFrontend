import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'iroute.token';
const EMAIL_KEY = 'iroute.email';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  readonly token = signal(sessionStorage.getItem(TOKEN_KEY) ?? '');
  readonly email = signal(sessionStorage.getItem(EMAIL_KEY) ?? '');

  get snapshot(): string {
    return this.token();
  }

  setSession(token: string, email: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(EMAIL_KEY, email);
    this.token.set(token);
    this.email.set(email);
  }

  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    this.token.set('');
    this.email.set('');
  }
}

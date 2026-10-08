import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthPort } from './application/ports/auth.port';
import { CommercePort } from './application/ports/commerce.port';
import { HttpAuthAdapter } from './infrastructure/http/auth.adapter';
import { HttpCommerceAdapter } from './infrastructure/http/commerce.adapter';
import { authInterceptor } from './infrastructure/http/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: AuthPort, useExisting: HttpAuthAdapter },
    { provide: CommercePort, useExisting: HttpCommerceAdapter },
  ],
};

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthPort } from '../../application/ports/auth.port';
import { AuthSession, LoginCommand } from '../../domain/auth';

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

@Injectable({ providedIn: 'root' })
export class HttpAuthAdapter extends AuthPort {
  private readonly http = inject(HttpClient);

  async login(command: LoginCommand): Promise<AuthSession> {
    const body = await firstValueFrom(
      this.http.post<LoginResponse>('/api/auth/login', {
        email: command.email.trim(),
        password: command.password,
      }),
    );
    return {
      accessToken: body.accessToken,
      email: command.email.trim().toLowerCase(),
      expiresIn: body.expiresIn,
    };
  }
}

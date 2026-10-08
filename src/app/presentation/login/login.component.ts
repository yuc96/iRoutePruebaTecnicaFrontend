import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthPort } from '../../application/ports/auth.port';
import { TokenStore } from '../../infrastructure/storage/token.store';
import { ThemeService } from '../shared/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthPort);
  private readonly tokens = inject(TokenStore);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  fillPreset(): void {
    this.email = 'admin1@correo.com';
    this.password = 'Admin890@';
  }

  async submit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      const session = await this.auth.login({ email: this.email, password: this.password });
      this.tokens.setSession(session.accessToken, session.email);
      await this.router.navigateByUrl('/');
    } catch {
      this.error.set('Credenciales inválidas.');
    } finally {
      this.loading.set(false);
    }
  }
}

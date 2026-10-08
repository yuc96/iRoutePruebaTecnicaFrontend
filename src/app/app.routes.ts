import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './presentation/auth.guard';
import { LoginComponent } from './presentation/login/login.component';
import { WorkspaceComponent } from './presentation/workspace/workspace.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: '', component: WorkspaceComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];

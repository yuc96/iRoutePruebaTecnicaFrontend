import { AuthSession, LoginCommand } from '../../domain/auth';

export abstract class AuthPort {
  abstract login(command: LoginCommand): Promise<AuthSession>;
}

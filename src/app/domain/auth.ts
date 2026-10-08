export interface LoginCommand {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  email: string;
  expiresIn: number;
}

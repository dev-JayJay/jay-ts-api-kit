import { User } from '../../domain/entities/User';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface IAuthService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  generateToken(user: User): string;
  verifyToken(token: string): AuthTokenPayload;
}

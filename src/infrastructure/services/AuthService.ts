import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../domain/entities/User';
import { IAuthService, AuthTokenPayload } from '../../application/services/IAuthService';

export class AuthService implements IAuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET ?? 'change-me-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: 'user',
    };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn } as jwt.SignOptions);
  }

  verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
  }
}

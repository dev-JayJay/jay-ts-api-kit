import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AuthService } from '../../infrastructure/services/AuthService';

export const createAuthMiddleware = (authService: AuthService): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    try {
      const payload = authService.verifyToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
};

declare namespace Express {
  interface Request {
    requestId: string;
    rawBody: Buffer;
    user?: {
      id: string;
      email: string;
      role: string;
      permissions?: string[];
      sessionVersion?: number;
    };
  }
}

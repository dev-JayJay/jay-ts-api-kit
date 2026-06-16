export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
  sessionVersion?: number;
  permissions?: string[];
}

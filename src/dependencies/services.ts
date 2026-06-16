import { AuthService } from '../infrastructure/services/AuthService';
import { Repositories } from './repositories';

export const buildServices = (_repositories: Repositories) => {
  return {
    authService: new AuthService(),
  };
};

export type Services = ReturnType<typeof buildServices>;

import { CreateUserUseCase } from '../application/use-cases/users/CreateUserUseCase';
import { Repositories } from './repositories';
import { Services } from './services';

export const buildUseCases = (repositories: Repositories, services: Services) => {
  return {
    createUserUseCase: new CreateUserUseCase(
      repositories.userRepository,
      services.authService,
    ),
  };
};

export type UseCases = ReturnType<typeof buildUseCases>;

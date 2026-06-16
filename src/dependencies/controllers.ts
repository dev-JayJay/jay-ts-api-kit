import { UseCases } from './useCases';
import { UserController } from '../presentation/controllers/UserController';

export const buildControllers = (useCases: UseCases) => {
  return {
    userController: new UserController(useCases.createUserUseCase),
  };
};

export type Controllers = ReturnType<typeof buildControllers>;

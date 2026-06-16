import { Application } from 'express';
import { Controllers } from '../../dependencies/controllers';
import { Middlewares } from '../../dependencies/middlewares';
import { createUserRoutes } from './userRoutes';

export const registerRoutes = (
  app: Application,
  controllers: Controllers,
  middlewares: Middlewares,
): void => {
  app.use('/api/users', createUserRoutes(controllers.userController, middlewares.authMiddleware));
};

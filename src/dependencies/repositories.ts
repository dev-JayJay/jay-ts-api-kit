import { SequelizeUserRepository } from '../infrastructure/repositories/SequelizeUserRepository';
import { initializeModels } from '../infrastructure/database/sequelize/models';
import { getDatabaseConnection } from '../infrastructure/database';

export const buildRepositories = () => {
  initializeModels(getDatabaseConnection());

  return {
    userRepository: new SequelizeUserRepository(),
  };
};

export type Repositories = ReturnType<typeof buildRepositories>;

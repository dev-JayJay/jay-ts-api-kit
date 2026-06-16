import { Sequelize } from 'sequelize';
import { UserModel } from './UserModel';

export const initializeModels = (sequelize: Sequelize): void => {
  UserModel.initialize(sequelize);
};

export { UserModel };

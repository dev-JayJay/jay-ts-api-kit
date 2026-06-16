import { Sequelize } from 'sequelize';
import { sequelizeConfig } from './sequelize/config';

let sequelizeInstance: Sequelize | null = null;

export const getDatabaseConnection = (): Sequelize => {
  if (!sequelizeInstance) {
    sequelizeInstance = new Sequelize(
      sequelizeConfig.database,
      sequelizeConfig.username,
      sequelizeConfig.password,
      {
        host: sequelizeConfig.host,
        port: sequelizeConfig.port,
        dialect: sequelizeConfig.dialect as 'postgres',
        logging: process.env.NODE_ENV !== 'production' ? console.log : false,
        pool: {
          min: 2,
          max: 10,
          acquire: 30000,
          idle: 10000,
        },
      }
    );
  }
  return sequelizeInstance;
};

export const closeDatabaseConnection = async (): Promise<void> => {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    sequelizeInstance = null;
  }
};

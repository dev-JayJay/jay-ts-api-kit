import 'dotenv/config';
import { createApp } from './app';
import { getDatabaseConnection } from './infrastructure/database';
import { initializeModels } from './infrastructure/database/sequelize/models';
import { env } from './infrastructure/config/env';
import { buildDependencies } from './dependencies';
import { registerRoutes } from './presentation/routes';
import { logger } from './shared/logging/logger';

const startServer = async (): Promise<void> => {
  env.validate();
  logger.info('Environment validated', { nodeEnv: env.NODE_ENV });

  const db = getDatabaseConnection();
  await db.authenticate();
  logger.info('Database connected', { database: env.DB_NAME });

  initializeModels(db);
  logger.info('Models initialized');

  const deps = buildDependencies();
  logger.info('Dependencies built');

  const app = createApp((app) => {
    registerRoutes(app, deps.controllers, deps.middlewares);
  });

  const port = env.PORT;
  app.listen(port, () => logger.info(`Server running on port ${port}`));
};

startServer().catch((err) => {
  logger.error('Fatal startup error', { error: (err as Error).message });
  process.exit(1);
});

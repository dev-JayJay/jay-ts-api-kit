import { buildRepositories } from './repositories';
import { buildServices } from './services';
import { buildUseCases } from './useCases';
import { buildControllers } from './controllers';
import { buildMiddlewares } from './middlewares';

export const buildDependencies = () => {
  const repositories = buildRepositories();
  const services = buildServices(repositories);
  const useCases = buildUseCases(repositories, services);
  const controllers = buildControllers(useCases);
  const middlewares = buildMiddlewares(services);

  return {
    repositories,
    services,
    useCases,
    controllers,
    middlewares,
  };
};

export type Dependencies = ReturnType<typeof buildDependencies>;

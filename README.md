# jay-ts-api-kit

Reusable TypeScript API/server starter kit based on Clean Architecture. This template separates business rules from frameworks so you can swap web frameworks, databases, and third-party services without rewriting core logic.

## Architecture

```text
src/
|
|-- domain/
|   |-- entities/
|   |-- repositories/
|   `-- errors/
|
|-- application/
|   |-- use-cases/
|   |-- dto/
|   `-- interfaces/
|
|-- infrastructure/
|   |-- database/
|   |   |-- sequelize/
|   |   |   |-- models/
|   |   |   |-- migrations/
|   |   |   `-- config.ts
|   |   `-- index.ts
|   |-- repositories/
|   `-- services/
|
|-- presentation/
|   |-- controllers/
|   |-- routes/
|   `-- middlewares/
|
|-- shared/
|   |-- utils/
|   |-- constants/
|   `-- types/
|
`-- server.ts
```

## Layer Responsibilities

- `domain`: pure business logic.
- `application`: use-cases and orchestration around domain rules.
- `infrastructure`: implementation details (DB, external APIs, repositories).
- `presentation`: transport layer (HTTP controllers, routes, middleware).
- `shared`: cross-cutting helpers and shared types/constants.

## Dependency Rule (Important)

Dependencies must point inward:

- `presentation` can depend on `application` and `shared`.
- `infrastructure` can depend on `application`, `domain`, and `shared`.
- `application` can depend on `domain` and `shared`.
- `domain` depends on nothing outside `domain` (and very minimal `shared` types if needed).

Do not import framework/database code into `domain`.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development

```bash
npm run dev
```

### 3. Build

```bash
npm run build
```

### 4. Run production build

```bash
npm start
```

## How To Use This Kit

### 1. Add a Domain Entity

Create files in `src/domain/entities` and keep them framework-agnostic.

Example: `User.ts`

```ts
export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string
  ) {}
}
```

### 2. Define Repository Contracts

Add repository interfaces in `src/domain/repositories`.

Example: `IUserRepository.ts`

```ts
import { User } from '../entities/User';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

### 3. Write a Use Case

Add use-cases in `src/application/use-cases` and accept contracts via constructor injection.

Example: `CreateUserUseCase.ts`

```ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: { id: string; name: string; email: string }): Promise<void> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new Error('Email already exists');

    const user = new User(input.id, input.name, input.email);
    await this.userRepository.save(user);
  }
}
```

### 4. Implement Infrastructure Adapters

Implement interfaces in `src/infrastructure/repositories`.

Example: `SequelizeUserRepository.ts`

```ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class SequelizeUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    // TODO: Query Sequelize model here
    return null;
  }

  async save(user: User): Promise<void> {
    // TODO: Persist using Sequelize model here
  }
}
```

### 5. Expose Through Presentation Layer

- Controllers map HTTP request/response to use-case input/output.
- Routes register controller handlers.
- Middlewares handle cross-cutting concerns (auth, validation, logging).

## Suggested Naming Conventions

- Entities: `PascalCase` (e.g., `User.ts`).
- Repository contracts: `I{Name}Repository.ts`.
- Use-cases: `{Action}{Entity}UseCase.ts`.
- Controllers: `{Entity}Controller.ts`.
- DTOs: `{Action}{Entity}Dto.ts` or `{Entity}Dto.ts`.

## Database (Sequelize) Notes

- Keep Sequelize models and migrations under `src/infrastructure/database/sequelize`.
- Keep ORM-specific mapping out of `domain`.
- Convert ORM models into domain entities inside repository implementations.

## Environment Variables

Create a `.env` for runtime config, for example:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_db
DB_USER=postgres
DB_PASSWORD=postgres
```

## Roadmap Ideas

- Add dependency injection container (e.g., tsyringe).
- Add request validation (e.g., zod).
- Add standardized error handling.
- Add tests (unit + integration).
- Add OpenAPI/Swagger docs.
- Add Docker and docker-compose.
- Add CI pipeline (lint, test, build).

## Contribution

1. Fork or clone this repository.
2. Create your feature branch.
3. Keep layer boundaries clean.
4. Open a pull request.

## License

MIT

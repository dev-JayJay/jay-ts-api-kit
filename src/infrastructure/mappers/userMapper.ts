import { User } from '../../domain/entities/User';
import { UserModel } from '../database/sequelize/models/UserModel';

export const toDomain = (model: UserModel): User => {
  return new User(
    model.id,
    model.name,
    model.email,
    model.created_at,
    model.updated_at,
  );
};

export const toPersistence = (domain: User, passwordHash?: string): Partial<UserModel> => {
  return {
    id: domain.id,
    name: domain.name,
    email: domain.email,
    password_hash: passwordHash ?? '',
  };
};

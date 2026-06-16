import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserModel } from '../database/sequelize/models/UserModel';
import { toDomain, toPersistence } from '../mappers/userMapper';

export class SequelizeUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const model = await UserModel.findByPk(id);
    return model ? toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await UserModel.findOne({ where: { email } });
    return model ? toDomain(model) : null;
  }

  async save(user: User): Promise<void> {
    const data = toPersistence(user);
    await UserModel.upsert(data as UserModel);
  }

  async delete(id: string): Promise<void> {
    await UserModel.destroy({ where: { id } });
  }
}

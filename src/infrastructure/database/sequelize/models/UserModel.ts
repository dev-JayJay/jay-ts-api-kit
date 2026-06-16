import { DataTypes, Model, Sequelize } from 'sequelize';

interface UserModelAttributes {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel extends Model<UserModelAttributes> implements UserModelAttributes {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password_hash: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  static initialize(sequelize: Sequelize): void {
    UserModel.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password_hash: { type: DataTypes.STRING(255), allowNull: false },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
      }
    );
  }
}

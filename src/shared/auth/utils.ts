import { User } from '../../domain/entities/User';
import { PublicUser } from './types';

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
});

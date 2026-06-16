import { randomUUID } from 'crypto';
import { User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUserDto } from '../../dto/CreateUserDto';
import { IAuthService } from '../../services/IAuthService';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthService,
  ) {}

  async execute(input: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('A user with this email already exists');
    }

    const hashedPassword = await this.authService.hashPassword(input.password);
    const user = new User(randomUUID(), input.name, input.email);
    // In a real impl, you'd persist the hashed password separately
    await this.userRepository.save(user);
    return user;
  }
}

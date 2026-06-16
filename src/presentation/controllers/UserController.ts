import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/users/CreateUserUseCase';
import { CreateUserDto } from '../../application/dto/CreateUserDto';

export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async create(req: Request, res: Response): Promise<void> {
    const dto: CreateUserDto = req.body;
    const user = await this.createUserUseCase.execute(dto);
    res.status(201).json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
  }
}

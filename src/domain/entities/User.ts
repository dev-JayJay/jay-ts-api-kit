export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}

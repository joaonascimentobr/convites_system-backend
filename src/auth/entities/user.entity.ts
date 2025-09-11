// src/auth/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public passwordHash: string,
  ){}
}

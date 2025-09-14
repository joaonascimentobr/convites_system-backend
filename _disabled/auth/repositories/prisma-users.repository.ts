// src/auth/repositories/prisma-users.repository.ts
import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { User } from '../entities/user.entity';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const u = await this.prisma.user.findUnique({ where: { email } });
    return u ? new User(u.id, u.name, u.email, u.password) : null;
    }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const u = await this.prisma.user.create({ data: { name: data.name, email: data.email, password: data.passwordHash } });
    return new User(u.id, u.name, u.email, u.password);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}
  async create(email: string, passwordHash: string) {
    const u = await this.prisma.user.create({ data: { email, password: passwordHash } });
    return { id: u.id, email: u.email };
  }
  async findByEmail(email: string) {
    const u = await this.prisma.user.findUnique({ where: { email } });
    return u ? { id: u.id, email: u.email, password: u.password } : null;
  }
  async findById(id: number) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    return u ? { id: u.id, email: u.email } : null;
  }
}

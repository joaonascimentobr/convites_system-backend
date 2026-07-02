import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, LoginInput, LoginOutput, RegisterInput } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthUser> {
    const name = input.name?.trim() || null;
    const email = this.normalizeEmail(input.email);
    const password = this.validatePassword(input.password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    return this.serializeUser(user);
  }

  async login(input: LoginInput): Promise<LoginOutput> {
    const email = this.normalizeEmail(input.email);
    const password = this.requireString(input.password, 'Senha é obrigatória');

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwt.signAsync(payload);

    return {
      token,
      user: this.serializeUser(user),
    };
  }

  private serializeUser(user: { id: string; name: string | null; email: string }): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private normalizeEmail(email?: string): string {
    const normalized = this.requireString(email, 'E-mail é obrigatório').trim().toLowerCase();

    if (!normalized.includes('@')) {
      throw new BadRequestException('E-mail inválido');
    }

    return normalized;
  }

  private validatePassword(password?: string): string {
    const value = this.requireString(password, 'Senha é obrigatória');

    if (value.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres');
    }

    return value;
  }

  private requireString(value: string | undefined, message: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(message);
    }

    return value;
  }
}

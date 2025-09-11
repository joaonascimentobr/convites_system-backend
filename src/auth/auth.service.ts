// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private users: UsersRepository, private jwt: JwtService) {}

  async register(name: string, email: string, password: string) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ConflictException('Email already in use');
    const hash = await bcrypt.hash(password, 10);
    const user = await this.users.create({ name, email, passwordHash: hash });
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, name: user.name });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, name: user.name });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}


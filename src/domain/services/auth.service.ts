import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../repositories/user.repository';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository') private users: IUserRepository,
    private jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const hash = await argon2.hash(password);
    const u = await this.users.create(email, hash);
    return this.tokens(u.id, u.email);
  }

  async login(email: string, password: string) {
    const u = await this.users.findByEmail(email);
    if (!u || !(await argon2.verify(u.password, password))) throw new UnauthorizedException('Credenciais inválidas');
    return this.tokens(u.id, u.email);
  }

  private tokens(id: number, email: string) {
    const accessToken = this.jwt.sign({ sub: id, email }, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign({ sub: id }, { expiresIn: '7d' });
    return { accessToken, refreshToken, user: { id, email } };
  }
}

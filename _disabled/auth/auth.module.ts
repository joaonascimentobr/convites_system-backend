// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersRepository } from './repositories/users.repository';
import { PrismaUsersRepository } from './repositories/prisma-users.repository';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET!, signOptions: { expiresIn: '7d' } })],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: UsersRepository, useClass: PrismaUsersRepository },
  ],
  exports: [JwtModule],
})
export class AuthModule {}

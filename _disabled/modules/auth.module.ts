import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../application/controllers/auth.controller';
import { AuthService } from '../domain/services/auth.service';
import { UserPrismaRepository } from '../infrastructure/repositories/user.prisma.repository';
import { JwtStrategy } from '../security/jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({ secret: cfg.get<string>('JWT_SECRET'), signOptions: { expiresIn: '15m' } })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, { provide: 'IUserRepository', useClass: UserPrismaRepository }],
  exports: [AuthService]
})
export class AuthModule {}

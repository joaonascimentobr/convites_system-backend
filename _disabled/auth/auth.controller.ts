// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@/common/auth.guard';
import { CurrentUser } from '@/common/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto) {
    return this.service.register(dto.name, dto.email, dto.password);
  }

  @Post('login') login(@Body() dto: LoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  @UseGuards(AuthGuard)
  @Get('me') me(@CurrentUser() user: any) {
    return { user };
  }
}

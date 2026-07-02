import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput, RegisterInput } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterInput) {
    return this.auth.register(body);
  }

  @Post('login')
  login(@Body() body: LoginInput) {
    return this.auth.login(body);
  }
}

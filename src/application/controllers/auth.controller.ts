import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../../domain/services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() b: { email: string; password: string }) {
    return this.auth.register(b.email, b.password);
  }

  @Post('login')
  login(@Body() b: { email: string; password: string }) {
    return this.auth.login(b.email, b.password);
  }
}

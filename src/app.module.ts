// src/app.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { HealthController } from 'health.controller';
import { join } from 'path';
import { PaymentsModule } from './payments/payments-.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    AuthModule,
    PaymentsModule,
  ],

  controllers: [HealthController],
})
export class AppModule {}

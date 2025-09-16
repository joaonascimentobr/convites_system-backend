// src/app.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { HealthController } from 'health.controller';
import { join } from 'path';
import { PaymentsModule } from './payments/payments-.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    PaymentsModule,
  ],

  controllers: [HealthController],
})
export class AppModule {}

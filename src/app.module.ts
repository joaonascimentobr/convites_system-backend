// src/app.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { HealthController } from 'health.controller';
import { join } from 'path';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments-.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    AuthModule,
    OrdersModule,
    PaymentsModule,
  ],

  controllers: [HealthController],
})
export class AppModule {}

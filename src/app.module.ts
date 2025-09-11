import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth.module';
import { OrdersModule } from './modules/orders.module';
import { PaymentsModule } from './modules/payments.module';
import { WebhooksModule } from './modules/webhooks.module';
import { InvitesModule } from './modules/invites.module';

const EnvSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  PAGSEGURO_ENV: z.enum(['sandbox','production']).default('sandbox'),
  PAGSEGURO_TOKEN: z.string(),
  BASE_URL: z.string()
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal:true, validate: (cfg)=>EnvSchema.parse(cfg) }),
    PrismaModule,
    AuthModule,
    OrdersModule,
    PaymentsModule,
    WebhooksModule,
    InvitesModule
  ]
})
export class AppModule {}

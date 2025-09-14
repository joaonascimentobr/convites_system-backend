// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

import { PrismaService } from './prisma/prisma.service'
import { PaymentsController } from './payments/payments.controller'
import { PaymentsService } from './payments/payments.service'
import { InviteService } from './invite/invite.service'
import { PagSeguroGateway } from './payments/gateway/pagseguro.gateway'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'), // serve /public/*
    }),
  ],
  controllers: [PaymentsController],
  providers: [PrismaService, PaymentsService, InviteService, PagSeguroGateway],
})
export class AppModule {}

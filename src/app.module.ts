import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

import { PrismaService } from './prisma/prisma.service'
import { PaymentsController } from './payments/payments.controller'
import { PaymentsService } from './payments/payments.service'
import { InviteService } from './invite/invite.service'
import { PaymentGateway } from './payments/gateway/payment.gateway'
import { PagSeguroGateway } from './payments/gateway/pagseguro.gateway'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
  ],
  controllers: [PaymentsController],
  providers: [
    PrismaService,
    InviteService,
    PaymentsService,
    // token abstrato -> implementação
    { provide: PaymentGateway, useClass: PagSeguroGateway },
  ],
})
export class AppModule {}

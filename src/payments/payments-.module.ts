import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MercadoPagoGateway } from './gateway/mercadopago.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoGateway, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

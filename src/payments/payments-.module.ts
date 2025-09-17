// src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PagSeguroGateway } from './gateway/pagseguro.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PaymentsService, PagSeguroGateway, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

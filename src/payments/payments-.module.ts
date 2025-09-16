// src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PagSeguroGateway } from './gateway/pagseguro.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { InviteService } from '../invite/invite.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PagSeguroGateway, PrismaService, InviteService],
})
export class PaymentsModule {}

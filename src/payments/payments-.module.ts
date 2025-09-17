// src/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PagSeguroGateway } from './gateway/pagseguro.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { InviteService } from '../invite/invite.service';

@Module({
  providers: [PaymentsService, PagSeguroGateway, PrismaService, InviteService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

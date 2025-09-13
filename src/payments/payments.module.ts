// src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentGateway } from './gateway/payment.gateway';
import { InviteService } from '../invite/invite.service';
import { PagSeguroGateway } from './gateway/pagseguro.gateway';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PaymentGateway, useClass: PagSeguroGateway },
    InviteService,
    
  ],
})
export class PaymentsModule {}

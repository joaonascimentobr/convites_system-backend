// src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from '../src/payments/payments.controller';
import { PaymentsService } from '../src/payments/payments.service';
import { PaymentGateway } from '../src/payments/gateway/payment.gateway';
import { InviteService } from '../src/invite/invite.service';
import { PagSeguroGateway } from '../src/payments/gateway/pagseguro.gateway';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PaymentGateway, useClass: PagSeguroGateway },
    InviteService,
    
  ],
})
export class PaymentsModule {}

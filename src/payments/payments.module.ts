// src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentGateway } from './gateway/payment.gateway';
import { PagSeguroGateway } from './gateway/pagseguro.gateway';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PaymentGateway, useClass: PagSeguroGateway },
  ],
})
export class PaymentsModule {}

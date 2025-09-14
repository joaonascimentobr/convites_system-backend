import { Module } from '@nestjs/common';
import { PaymentsController } from '../application/controllers/payments.controller';
import { PaymentsService } from '../domain/services/payments.service';
import { PagSeguroGateway } from '../infrastructure/payments/pagseguro.gateway';

@Module({ controllers:[PaymentsController], providers:[PaymentsService, { provide:'IPaymentGateway', useClass: PagSeguroGateway }] })
export class PaymentsModule {}

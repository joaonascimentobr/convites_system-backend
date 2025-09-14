import { Module } from '@nestjs/common';
import { WebhooksController } from '../application/controllers/webhooks.controller';
import { PaymentsService } from '../domain/services/payments.service';
import { PagSeguroGateway } from '../infrastructure/payments/pagseguro.gateway';

@Module({ controllers:[WebhooksController], providers:[PaymentsService, { provide:'IPaymentGateway', useClass: PagSeguroGateway }] })
export class WebhooksModule {}

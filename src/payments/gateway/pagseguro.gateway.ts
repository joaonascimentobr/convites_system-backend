// src/payments/gateway/pagseguro.gateway.ts
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CheckoutInput, GatewayTx, PaymentStatus } from '../payment.types';

@Injectable()
export class PagSeguroGateway {
  async checkout({ orderId, amountCents, method }: CheckoutInput): Promise<GatewayTx> {
    // stub/simulação
    const id = randomUUID();
    return {
      id,
      status: PaymentStatus.PENDING,
      checkoutUrl: null, // ok porque agora é opcional
      qrCodeUrl: null,   // idem
    };
  }
}

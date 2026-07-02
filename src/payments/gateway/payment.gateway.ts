import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CheckoutInput, GatewayTx, PaymentStatus } from '../payment.types';

@Injectable()
export class PagSeguroGateway {
  /**
   * Stub de integração: crie aqui a chamada real ao PagSeguro.
   * Retornamos um id sintético e status PENDING para manter o fluxo funcionando.
   */
  async checkout(_input: CheckoutInput): Promise<GatewayTx> {
    return {
      id: `pg_${randomUUID()}`,
      status: PaymentStatus.PENDING,
      checkoutUrl: null,
      qrCodeUrl: null,
    };
  }
}

// src/payments/gateway/pagseguro.gateway.ts

import { Injectable } from '@nestjs/common';
import {
  CheckoutInput,
  GatewayTx,
  PaymentStatus,
} from '../payment.types';

@Injectable()
export class PagSeguroGateway {
  /**
   * Integração com o PagSeguro.
   * Troque este stub pela chamada real quando estiver pronto.
   */
  async checkout(input: CheckoutInput): Promise<GatewayTx> {
    // TODO: chamar API real do PagSeguro e mapear o retorno para { id, status }
    // Mantém o contrato e evita quebrar o resto do app.
    const id = `ps_${Date.now()}`;
    return { id, status: PaymentStatus.PENDING };
  }
}

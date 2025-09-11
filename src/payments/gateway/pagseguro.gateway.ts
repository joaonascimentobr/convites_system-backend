// src/payments/gateway/pagseguro.gateway.ts
import { Injectable } from '@nestjs/common';
import { PaymentGateway, CheckoutInput, CheckoutOutput } from './payment.gateway';

// Placeholder: aqui iremos ligar a API real quando o token JWT do vendedor estiver ok.
@Injectable()
export class PagSeguroGateway implements PaymentGateway {
  async checkout(input: CheckoutInput): Promise<CheckoutOutput> {
    return {
      transactionId: `tx-${input.orderId}-${Date.now()}`,
      checkoutUrl: `https://sandbox.pagseguro.uol.com.br/checkout/tx-${input.orderId}`,
    };
  }
  async getStatus(transactionId: string) {
    // retornar algo fake por enquanto
    return { status: 'CREATED' };
  }
}

// src/payments/gateway/pagseguro.gateway.ts
import { Injectable } from '@nestjs/common'
import { PaymentGateway, CheckoutInput, CheckoutOutput } from './payment.gateway'

// Placeholder — conecte na API real do PagSeguro depois (PIX / Cartão).
@Injectable()
export class PagSeguroGateway implements PaymentGateway {
  async checkout(input: CheckoutInput): Promise<CheckoutOutput> {
    const transactionId = `pg-${input.orderId}-${Date.now()}`
    return {
      transactionId,
      checkoutUrl: `https://sandbox.pagseguro.uol.com.br/checkout/${transactionId}`,
    }
  }
}

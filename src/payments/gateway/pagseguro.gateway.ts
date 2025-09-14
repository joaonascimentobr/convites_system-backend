// src/payments/gateway/pagseguro.gateway.ts
import { Injectable } from '@nestjs/common'
import { PaymentGateway, CheckoutInput, CheckoutOutput } from './payment.gateway'
import { randomUUID } from 'crypto'

// Placeholder — conecte na API real do PagSeguro depois (PIX / Cartão).
@Injectable()
export class PagSeguroGateway implements PaymentGateway {
  async checkout({ orderId, amountCents, method }: { orderId: string; amountCents: number; method: string }) {
    // stub local: gera um id único
   return { transactionId: `pg_${randomUUID()}`, checkoutUrl: null, qrCode: null }
  }
}


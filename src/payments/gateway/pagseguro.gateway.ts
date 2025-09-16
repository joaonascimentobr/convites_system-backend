// src/payments/gateway/pagseguro.gateway.ts
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentMethod } from '../payment.types';

export type CheckoutInput = { orderId: string; amountCents: number; method: PaymentMethod };
export type CheckoutOutput = { transactionId: string; checkoutUrl: string | null; qrCode: string | null };

@Injectable()
export class PagSeguroGateway {
  async checkout(_input: CheckoutInput): Promise<CheckoutOutput> {
    return { transactionId: `pg_${randomUUID()}`, checkoutUrl: null, qrCode: null };
  }
}

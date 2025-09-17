// src/payments/gateway/pagseguro.gateway.ts
import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PagSeguroGateway {
  async checkout(_input: { orderId: string; amountCents: number; method: PaymentMethod }) {
    // Aqui depois você chama a API real e mapeia
    return {
      id: `pg_${randomUUID()}`,
      status: PaymentStatus.PENDING,
    };
  }
}

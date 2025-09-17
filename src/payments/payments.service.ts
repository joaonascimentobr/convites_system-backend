// src/payments/payments.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PagSeguroGateway } from './gateway/pagseguro.gateway';
// Importa TUDO do Prisma por aqui (enums + tipos de erro)
import { Prisma, PaymentMethod, PaymentStatus } from '@prisma/client';



@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagSeguro: PagSeguroGateway,
  ) {}

  /**
   * Idempotente por orderId:
   * - Se já existir, retorna o mesmo registro
   * - Senão, cria. Em caso de corrida, trata P2002 e retorna o criado pela outra thread
   */
  async checkout(input: { orderId: string; amountCents: number; method: PaymentMethod }) {
    const { orderId, amountCents, method } = input;

    if (!orderId || amountCents <= 0) {
      throw new BadRequestException('Dados inválidos para checkout');
    }

    // 1) fast-path
    const found = await this.prisma.payment.findUnique({ where: { orderId } });
    if (found) return found;

    // 2) cria transação no gateway (stub/real)
    const tx = await this.pagSeguro.checkout({ orderId, amountCents, method });

    // 3) tenta gravar; se colidir, busca e retorna
    try {
      return await this.prisma.payment.create({
        data: {
          orderId,
          amountCents,
          method,                         // Prisma enum
          transactionId: tx.id,
          status: tx.status ?? PaymentStatus.PENDING, // Prisma enum
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const concurrent = await this.prisma.payment.findUnique({ where: { orderId } });
        if (concurrent) return concurrent;
      }
      throw e;
    }
  }

  async getStatus(params: { orderId?: string; transactionId?: string }) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          params.orderId ? { orderId: params.orderId } : undefined,
          params.transactionId ? { transactionId: params.transactionId } : undefined,
        ].filter(Boolean) as any,
      },
    });
    return payment ?? null;
  }

  async handleWebhook(_payload: any) {
    // TODO: validar HMAC, mapear status e dar update por transactionId
    return { ok: true };
  }
}

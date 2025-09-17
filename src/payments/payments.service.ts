// src/payments/payments.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { InviteService } from '../invite/invite.service'; // mantém se você usa em outro fluxo
import { PagSeguroGateway } from './gateway/pagseguro.gateway';
import {
  CheckoutInput,
  GatewayTx,
  PaymentMethod,
  PaymentStatus,
} from './payment.types';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagSeguro: PagSeguroGateway,
    private readonly invites: InviteService, // pode ficar aqui, mesmo se ainda não usar
  ) {}

  /**
   * Fluxo idempotente de checkout
   */
  async checkout(input: CheckoutInput) {
    const { orderId, amountCents, method } = input;

    if (!orderId || amountCents <= 0) {
      throw new BadRequestException('Dados inválidos para checkout');
    }

    // 1) fast-path: já existe?
    const found = await this.prisma.payment.findUnique({
      where: { orderId },
    });
    if (found) return found;

    // 2) cria a transação no gateway
    const tx: GatewayTx = await this.pagSeguro.checkout({
      orderId,
      amountCents,
      method,
    });

    // 3) tenta gravar (lidando com corrida P2002)
    try {
      const created = await this.prisma.payment.create({
        data: {
          orderId,
          amountCents,
          method,                    // enum PaymentMethod
          transactionId: tx.id,
          status: tx.status,         // enum PaymentStatus
        },
      });
      return created;
    } catch (e: any) {
      // Conflito de unicidade (outra requisição inseriu entre o findUnique e o create)
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        const concurrent = await this.prisma.payment.findUnique({
          where: { orderId },
        });
        if (concurrent) return concurrent;
      }
      throw e;
    }
  }

  /**
   * Consulta por orderId (ajuste conforme seus endpoints)
   */
  async getStatusByOrder(orderId: string) {
    return this.prisma.payment.findUnique({ where: { orderId } });
  }

  /**
   * Webhook (placeholder para você ligar ao PagSeguro)
   */
  async handleWebhook(payload: any) {
    // TODO: validar assinatura, atualizar status a partir do gateway
    return { ok: true };
  }
}

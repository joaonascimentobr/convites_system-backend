// src/payments/payments.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteService } from '../invite/invite.service';
import { PaymentMethod } from './payment.types';
import { PagSeguroGateway } from './gateway/pagseguro.gateway';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PagSeguroGateway,
    private readonly invites: InviteService,
  ) {}

  async checkout(orderId: string, amountCents: number, method: PaymentMethod) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const { transactionId, checkoutUrl, qrCode } = await this.gateway.checkout({
      orderId,
      amountCents,
      method,
    });

    await this.prisma.payment.upsert({
      where: { orderId },
      update: { amountCents, method, transactionId, status: 'PAYMENT_PENDING' },
      create: { orderId, amountCents, method, transactionId, status: 'PAYMENT_PENDING' },
    });

    return { transactionId, checkoutUrl, qrCode };
  }

  async getStatus(params: { orderId?: string; reference?: string; transactionId?: string }) {
    const where = params.transactionId
      ? { transactionId: params.transactionId }
      : params.orderId
      ? { orderId: params.orderId }
      : undefined;

    if (!where) throw new BadRequestException('Informe transaction_id ou order_id');

    const payment = await this.prisma.payment.findFirst({ where });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }

  async handleWebhook(payload: any) {
    const { transactionId, status } = payload ?? {};
    if (!transactionId) throw new BadRequestException('transactionId ausente');

    const nextMapped =
      status === 'paid' || status === 'PAYMENT_PAID'
        ? 'PAYMENT_PAID'
        : status === 'canceled'
        ? 'PAYMENT_CANCELED'
        : 'PAYMENT_PENDING';

    await this.prisma.$transaction(async (tx) => {
      const pay = await tx.payment.update({
        where: { transactionId },
        data: { status: nextMapped },
      });

      if (nextMapped === 'PAYMENT_PAID') {
        const order = await tx.order.findUnique({
          where: { id: pay.orderId },
          include: { theme: true },
        });
        if (order) await this.invites.render(order);
      }
    });

    return { ok: true };
  }
}

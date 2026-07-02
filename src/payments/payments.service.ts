// src/payments/payments.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PagSeguroGateway } from './gateway/pagseguro.gateway';
import { PaymentMethod, PaymentStatus } from './payment.types';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagSeguroGateway: PagSeguroGateway,
  ) {}

  async checkout(input: {
    orderId: string;
    amountCents: number | string;
    method: PaymentMethod | string;
  }) {
    const orderId = input.orderId?.trim();
    const amountCents = this.normalizeAmount(input.amountCents);
    const method = this.normalizeMethod(input.method);

    if (!orderId) {
      throw new BadRequestException('Dados inválidos para checkout');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const tx = await this.pagSeguroGateway.checkout({
      orderId,
      amountCents,
      method,
    });

    try {
      return await this.prisma.payment.create({
        data: {
          orderId,
          amountCents,
          method,
          transactionId: tx.id,
          status: tx.status ?? PaymentStatus.PENDING,
        },
      });
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const concurrent = await this.prisma.payment.findUnique({ where: { orderId } });
        if (concurrent) {
          return concurrent;
        }
      }

      throw e;
    }
  }

  private normalizeAmount(amount: number | string): number {
    const parsed = typeof amount === 'string' ? Number(amount) : amount;

    if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed <= 0) {
      throw new BadRequestException('Dados inválidos para checkout');
    }

    const rounded = Math.trunc(parsed);
    if (rounded !== parsed) {
      throw new BadRequestException('Dados inválidos para checkout');
    }

    return rounded;
  }

  private normalizeMethod(method: PaymentMethod | string): PaymentMethod {
    const validMethods: PaymentMethod[] = ['PIX', 'CARD'];

    if (typeof method === 'string') {
      const normalized = method.trim().toUpperCase();
      if ((validMethods as readonly string[]).includes(normalized)) {
        return normalized as PaymentMethod;
      }
    }

    throw new BadRequestException('Método de pagamento inválido');
  }

  async getStatus(params: { orderId?: string; transactionId?: string }) {
    const filters = [
      params.orderId ? { orderId: params.orderId } : undefined,
      params.transactionId ? { transactionId: params.transactionId } : undefined,
    ].filter(Boolean) as Array<{ orderId?: string; transactionId?: string }>;

    if (!filters.length) {
      throw new BadRequestException('Informe orderId ou transactionId');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: filters,
      },
    });

    return payment ?? null;
  }

  async handleWebhook(payload: any) {
    const transactionId = this.extractTransactionId(payload);
    const status = this.extractStatus(payload);

    if (!transactionId) {
      throw new BadRequestException('Webhook sem transactionId');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
    });

    if (!payment) {
      return { ok: true, ignored: true };
    }

    if (!status || status === payment.status) {
      return { ok: true, payment };
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { transactionId },
      data: { status },
    });

    if (status === PaymentStatus.PAID) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: PaymentStatus.PAID },
      });
    }

    if (status === PaymentStatus.FAILED) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: PaymentStatus.FAILED },
      });
    }

    return { ok: true, payment: updatedPayment };
  }

  private extractTransactionId(payload: any): string | null {
    const rawId =
      payload?.transactionId ??
      payload?.transaction_id ??
      payload?.id ??
      payload?.data?.transactionId ??
      payload?.data?.transaction_id ??
      null;

    return typeof rawId === 'string' && rawId.trim() ? rawId.trim() : null;
  }

  private extractStatus(payload: any): PaymentStatus | null {
    const rawStatus =
      payload?.status ??
      payload?.paymentStatus ??
      payload?.payment_status ??
      payload?.data?.status ??
      null;

    if (typeof rawStatus !== 'string') {
      return null;
    }

    const normalized = rawStatus.trim().toUpperCase();

    if (normalized === PaymentStatus.PAID) {
      return PaymentStatus.PAID;
    }

    if (normalized === PaymentStatus.FAILED) {
      return PaymentStatus.FAILED;
    }

    if (normalized === PaymentStatus.PENDING) {
      return PaymentStatus.PENDING;
    }

    return null;
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoGateway } from './gateway/mercadopago.gateway';
import { PaymentMethod, PaymentStatus } from './payment.types';

type WebhookMetadata = {
  dataId?: string;
  signature?: string;
  requestId?: string;
  type?: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoGateway: MercadoPagoGateway,
  ) {}

  async checkout(input: {
    orderId: string;
    method: PaymentMethod | string;
  }) {
    const orderId = input.orderId?.trim();
    const method = this.normalizeMethod(input.method);

    if (!orderId) {
      throw new BadRequestException('Dados inválidos para checkout');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const amountCents = this.normalizeAmount(order.amountCents);

    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.PENDING) {
        const tx = await this.mercadoPagoGateway.checkout({
          orderId,
          amountCents,
          method,
          payerEmail: order.user.email,
          description: `Convite ${order.name}`,
        });
        return this.serializePayment(existingPayment, tx);
      }

      return existingPayment;
    }

    const tx = await this.mercadoPagoGateway.checkout({
      orderId,
      amountCents,
      method,
      payerEmail: order.user.email,
      description: `Convite ${order.name}`,
    });

    try {
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          amountCents,
          method,
          transactionId: tx.id,
          status: tx.status ?? PaymentStatus.PENDING,
        },
      });

      return this.serializePayment(payment, tx);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const concurrent = await this.prisma.payment.findUnique({ where: { orderId } });
        if (concurrent) {
          return concurrent;
        }
      }

      throw error;
    }
  }

  private normalizeAmount(amount: number | null): number {
    if (amount === null || !Number.isFinite(amount) || Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Dados inválidos para checkout');
    }

    const rounded = Math.trunc(amount);
    if (rounded !== amount) {
      throw new BadRequestException('Dados inválidos para checkout');
    }

    return rounded;
  }

  private normalizeMethod(method: PaymentMethod | string): PaymentMethod {
    if (typeof method === 'string' && method.trim().toUpperCase() === 'PIX') {
      return 'PIX';
    }

    throw new BadRequestException(
      'Neste momento o checkout do Mercado Pago está disponível apenas para PIX',
    );
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
      where: { OR: filters },
    });

    if (!payment) {
      return null;
    }

    // The Checkout Pro return includes the real payment id. Use it as a
    // fallback synchronization path when the provider delivers only a
    // merchant-order notification or the webhook is delayed.
    if (payment.status === PaymentStatus.PENDING && params.transactionId) {
      try {
        const remotePayment = await this.mercadoPagoGateway.getPayment(
          params.transactionId,
        );

        if (
          remotePayment.orderId &&
          params.orderId &&
          remotePayment.orderId !== params.orderId
        ) {
          return payment;
        }

        return this.syncPaymentStatus(payment, remotePayment);
      } catch {
        return payment;
      }
    }

    return payment;
  }

  async handleWebhook(payload: unknown, metadata: WebhookMetadata = {}) {
    const body = this.asRecord(payload);
    const type = this.readString(body?.type) ?? this.readString(metadata.type);

    if (type && type !== 'payment') {
      return { ok: true, ignored: true };
    }

    const transactionId =
      metadata.dataId ??
      this.readNestedString(body, ['data', 'id']) ??
      this.readString(body?.id);

    if (!transactionId) {
      throw new BadRequestException('Webhook sem data.id');
    }

    this.validateWebhookSignature(transactionId, metadata);

    const remotePayment = await this.mercadoPagoGateway.getPayment(transactionId);
    const payment = remotePayment.orderId
      ? await this.prisma.payment.findFirst({
          where: {
            OR: [
              { transactionId: remotePayment.id },
              { orderId: remotePayment.orderId },
            ],
          },
        })
      : await this.prisma.payment.findUnique({
          where: { transactionId: remotePayment.id },
        });

    if (!payment) {
      return { ok: true, ignored: true };
    }

    return { ok: true, payment: await this.syncPaymentStatus(payment, remotePayment) };
  }

  private async syncPaymentStatus(payment: any, remotePayment: any) {
    if (
      remotePayment.id === payment.transactionId &&
      remotePayment.status === payment.status
    ) {
      return payment;
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: remotePayment.id,
        status: remotePayment.status,
      },
    });

    if (remotePayment.status === PaymentStatus.PAID) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: PaymentStatus.PAID },
      });
    }

    if (remotePayment.status === PaymentStatus.FAILED) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: PaymentStatus.FAILED },
      });
    }

    return updatedPayment;
  }

  private serializePayment(payment: any, tx: any) {
    return {
      ...payment,
      checkoutUrl: tx.checkoutUrl ?? null,
    };
  }

  private validateWebhookSignature(transactionId: string, metadata: WebhookMetadata) {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();

    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          'Webhook do Mercado Pago não está configurado: informe MERCADOPAGO_WEBHOOK_SECRET',
        );
      }
      return;
    }

    if (!metadata.signature || !metadata.requestId) {
      throw new UnauthorizedException('Webhook do Mercado Pago sem assinatura');
    }

    const signatureParts = Object.fromEntries(
      metadata.signature.split(',').map((part) => {
        const [key, value] = part.trim().split('=', 2);
        return [key, value];
      }),
    );
    const ts = signatureParts.ts;
    const receivedHash = signatureParts.v1;

    if (!ts || !receivedHash) {
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    const manifest = `id:${transactionId.toLowerCase()};request-id:${metadata.requestId};ts:${ts};`;
    const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const receivedBuffer = Buffer.from(receivedHash, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private readNestedString(value: Record<string, unknown> | null, path: string[]) {
    let current: unknown = value;
    for (const key of path) {
      current = this.asRecord(current)?.[key];
    }
    return this.readString(current);
  }
}

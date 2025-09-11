// src/payments/payments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentGateway } from './gateway/payment.gateway';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private gateway: PaymentGateway, private prisma: PrismaService) {}

  async checkout(userId: number, orderId: number, amountCents: number, method: 'pix'|'card') {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');

    const res = await this.gateway.checkout({ orderId, amountCents, method });
    await this.prisma.payment.upsert({
      where: { orderId },
      update: { provider: 'pagseguro', transactionId: res.transactionId, status: 'CREATED', amountCents },
      create: { orderId, provider: 'pagseguro', transactionId: res.transactionId, status: 'CREATED', amountCents },
    });
    return res;
  }

  async getStatus(transactionId: string) {
    const status = await this.gateway.getStatus(transactionId);
    return status;
  }
}

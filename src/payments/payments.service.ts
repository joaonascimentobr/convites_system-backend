// src/payments/payments.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaClient, PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client'
import { PaymentGateway } from './gateway/payment.gateway'

const prisma = new PrismaClient()

@Injectable()
export class PaymentsService {
  constructor(private readonly gateway: PaymentGateway) {}

  async checkout(orderId: string, amountCents: number, method: PaymentMethod) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Order not found')

    const { transactionId, checkoutUrl, qrCode } = await this.gateway.checkout({ orderId, amountCents, method })

    await prisma.payment.upsert({
      where: { orderId },
      update: { amountCents, method, transactionId, status: PaymentStatus.PAYMENT_PENDING },
      create: { orderId, amountCents, method, transactionId, status: PaymentStatus.PAYMENT_PENDING },
    })

    return { transactionId, checkoutUrl, qrCode }
  }

  async getStatus(params: { orderId?: string; reference?: string; transactionId?: string }) {
    const { orderId, reference, transactionId } = params
    let payment = null

    if (transactionId) payment = await prisma.payment.findUnique({ where: { transactionId } })
    if (!payment && orderId) payment = await prisma.payment.findUnique({ where: { orderId } })
    if (!payment && reference) {
      const order = await prisma.order.findFirst({ where: { slug: reference } })
      if (order) payment = await prisma.payment.findUnique({ where: { orderId: order.id } })
    }

    if (!payment) throw new NotFoundException('Pagamento não encontrado')

    return {
      orderId: payment.orderId,
      transactionId: payment.transactionId,
      status: payment.status,
      amount: payment.amountCents,
      updatedAt: payment.updatedAt,
    }
  }

  async handleWebhook(payload: any) {
    // Simplificado: ajuste aqui conforme a notificação real do PagSeguro
    const tx = payload?.transactionId || payload?.id
    const status = (payload?.status as string | undefined) ?? 'PAYMENT_PENDING'
    if (!tx) throw new BadRequestException('transactionId ausente')

    const payment = await prisma.payment.findUnique({ where: { transactionId: tx } })
    if (!payment) throw new NotFoundException('Pagamento não encontrado')

    let newStatus: PaymentStatus = PaymentStatus.PAYMENT_PENDING
    if (/paid|approved/i.test(status)) newStatus = PaymentStatus.PAYMENT_PAID
    else if (/canceled|cancelled|refused/i.test(status)) newStatus = PaymentStatus.PAYMENT_CANCELED
    else if (/authorized/i.test(status)) newStatus = PaymentStatus.PAYMENT_AUTHORIZED

    const updated = await prisma.payment.update({
      where: { transactionId: tx },
      data: { status: newStatus },
    })

    if (newStatus === PaymentStatus.PAYMENT_PAID) {
      await prisma.order.update({ where: { id: updated.orderId }, data: { status: OrderStatus.PAID } })
    }

    return { ok: true }
  }
}

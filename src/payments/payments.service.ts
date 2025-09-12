// src/payments/payments.service.ts — sem enums Prisma; usando strings
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PaymentMethod, PaymentStatus } from './payment.types'
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
      update: { amountCents, method, transactionId, status: 'PAYMENT_PENDING' },
      create: { orderId, amountCents, method, transactionId, status: 'PAYMENT_PENDING' },
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
      status: payment.status as PaymentStatus,
      amount: payment.amountCents,
      updatedAt: payment.updatedAt,
    }
  }

  async handleWebhook(payload: any) {
    const tx = payload?.transactionId || payload?.id
    const status = (payload?.status as string | undefined) ?? 'PAYMENT_PENDING'
    if (!tx) throw new BadRequestException('transactionId ausente')

    const payment = await prisma.payment.findUnique({ where: { transactionId: tx } })
    if (!payment) throw new NotFoundException('Pagamento não encontrado')

    let newStatus: PaymentStatus = 'PAYMENT_PENDING'
    if (/paid|approved/i.test(status)) newStatus = 'PAYMENT_PAID'
    else if (/canceled|cancelled|refused/i.test(status)) newStatus = 'PAYMENT_CANCELED'
    else if (/authorized/i.test(status)) newStatus = 'PAYMENT_AUTHORIZED'

    const updated = await prisma.payment.update({
      where: { transactionId: tx },
      data: { status: newStatus },
    })

    if (newStatus === 'PAYMENT_PAID') {
      await prisma.order.update({ where: { id: updated.orderId }, data: { status: 'PAID' } })
    }

    return { ok: true }
  }
}

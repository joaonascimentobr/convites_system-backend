// src/payments/payments.service.ts — SQLite sem enums; usando DI
import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PaymentGateway } from './gateway/payment.gateway'
import type { PaymentMethod, PaymentStatus } from './payment.types'
import { InviteService } from '../invite/invite.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PaymentGateway) private readonly gateway: PaymentGateway, // token abstrato -> implementação
    private readonly invites: InviteService,
  ) {}

  async checkout(orderId: string, amountCents: number, method: PaymentMethod) {
  // 1) sanity check
  const order = await this.prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new NotFoundException('Order not found')

  // 2) chama o gateway (gera transactionId)
  let transactionId: string, checkoutUrl: string | null, qrCode: string | null
  try {
    const r = await this.gateway.checkout({ orderId, amountCents, method })
    transactionId = r.transactionId
    checkoutUrl = r.checkoutUrl
    qrCode = r.qrCode
  } catch (e) {
    console.error('[GATEWAY ERROR]', e)
    throw new BadRequestException('gateway_failed')
  }

  // 3) persiste o Payment SEM upsert (tolerante a legado) + logs de erro
  try {
    const existing = await this.prisma.payment.findFirst({ where: { orderId } })
    if (existing) {
      await this.prisma.payment.update({
        where: { id: existing.id },
        data: { amountCents, method, transactionId, status: 'PAYMENT_PENDING' },
      })
    } else {
      await this.prisma.payment.create({
        data: { orderId, amountCents, method, transactionId, status: 'PAYMENT_PENDING' },
      })
    }
  } catch (e) {
    const pe = e as Prisma.PrismaClientKnownRequestError
    console.error('[DB ERROR]', (pe as any).code ?? e, (pe as any).meta ?? '')
    throw new BadRequestException(`db_failed:${(pe as any).code ?? 'unknown'}`)
  }

  return { transactionId, checkoutUrl, qrCode }
}

  async getStatus(params: { orderId?: string; reference?: string; transactionId?: string }) {
    const { orderId, reference, transactionId } = params
    let payment = null

    if (transactionId) payment = await this.prisma.payment.findUnique({ where: { transactionId } })
    if (!payment && orderId) payment = await this.prisma.payment.findUnique({ where: { orderId } })
    if (!payment && reference) {
      const order = await this.prisma.order.findFirst({ where: { slug: reference } })
      if (order) payment = await this.prisma.payment.findUnique({ where: { orderId: order.id } })
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

    const payment = await this.prisma.payment.findUnique({ where: { transactionId: tx } })
    if (!payment) throw new NotFoundException('Pagamento não encontrado')

    let newStatus: PaymentStatus = 'PAYMENT_PENDING'
    if (/paid|approved/i.test(status)) newStatus = 'PAYMENT_PAID'
    else if (/canceled|cancelled|refused/i.test(status)) newStatus = 'PAYMENT_CANCELED'
    else if (/authorized/i.test(status)) newStatus = 'PAYMENT_AUTHORIZED'

    const updated = await this.prisma.payment.update({
      where: { transactionId: tx },
      data: { status: newStatus },
    })

    if (newStatus === 'PAYMENT_PAID') {
      await this.prisma.order.update({ where: { id: updated.orderId }, data: { status: 'PAID' } })
      // gera o convite automaticamente (opcional)
      try { await this.invites.generateForOrder(updated.orderId) } catch {}
    }

    return { ok: true }
  }
}

import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PaymentsService } from '../../domain/services/payments.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('webhooks/pagseguro')
export class WebhooksController {
  constructor(private pay: PaymentsService, private prisma: PrismaService) {}

  @Post()
  @HttpCode(200)
  async handle(@Body() payload: any) {
    const evt = this.pay.translateWebhook(payload);
    if (!evt) return { ok: true };
    const found = await this.prisma.order.findFirst({ where: { slug: evt.referenceId } })
      || await this.prisma.order.findFirst({ where: { id: Number(evt.referenceId) || 0 } });
    if (!found) return { ok: true };
    await this.prisma.order.update({ where: { id: found.id }, data: { status: evt.status } });
    return { ok: true };
  }
}

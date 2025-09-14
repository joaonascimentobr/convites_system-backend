import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { PaymentsService } from './payments.service'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('checkout')
  checkout(@Body() body: { orderId: string; amountCents: number; method?: 'PIX' | 'CARD' }) {
    return this.svc.checkout(body.orderId, body.amountCents, (body.method ?? 'PIX') as any)
  }

  @Get('status')
  getStatus(
    @Query('orderId') orderId?: string,
    @Query('reference') reference?: string,
    @Query('transaction_id') transactionId?: string,
  ) {
    return this.svc.getStatus({ orderId, reference, transactionId })
  }

  @Post('pagseguro/notify')
  webhook(@Body() payload: any) {
    return this.svc.handleWebhook(payload)
  }
}

// src/payments/payments.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { AuthGuard } from '@nestjs/passport'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  // Checkout (precisa estar autenticado)
  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  checkout(
    @Body() body: { orderId: string; amountCents: number; method?: 'PIX' | 'CARD' }
  ) {
    return this.svc.checkout(body.orderId, body.amountCents, (body.method ?? 'PIX') as any)
  }

  // Público — usado pela página de retorno / polling
  @Get('status')
  getStatus(
    @Query('orderId') orderId?: string,
    @Query('reference') reference?: string,
    @Query('transaction_id') transactionId?: string,
  ) {
    return this.svc.getStatus({ orderId, reference, transactionId })
  }

  // Webhook público do PagSeguro
  @Post('pagseguro/notify')
  webhook(@Body() payload: any) {
    return this.svc.handleWebhook(payload)
  }
}

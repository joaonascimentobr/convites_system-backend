import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CheckoutInput } from './payment.types';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('checkout')
  async checkout(@Body() body: CheckoutInput) {
    const { orderId, amountCents, method } = body;
    return this.payments.checkout({ orderId, amountCents, method });
  }


  @Get('status')
  async status(
    @Query('transaction_id') transactionId?: string,
    @Query('order_id')      orderId?: string,
  ) {
    return this.payments.getStatus({ transactionId, orderId });
  }

  @Post('mercadopago/notify')
  async notify(
    @Body() payload: unknown,
    @Query('data.id') dataId?: string,
    @Headers('x-signature') signature?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.payments.handleWebhook(payload, { dataId, signature, requestId });
  }
}

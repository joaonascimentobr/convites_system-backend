import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CheckoutInput, PaymentMethod } from './payment.types';


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

  @Post('pagseguro/notify')
  async notify(@Body() payload: any) {
    return this.payments.handleWebhook(payload);
  }
}

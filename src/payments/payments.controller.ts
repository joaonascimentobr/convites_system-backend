// src/payments/payments.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/checkout.dto';
import { AuthGuard } from '@/common/auth.guard';
import { CurrentUser } from '@/common/current-user.decorator';

@UseGuards(AuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto, @CurrentUser() user: any) {
    return this.service.checkout(user.id, dto.orderId, dto.amountCents, dto.method);
  }

  // usado pela página /pagseguro/return (frontend)
  @Get('pagseguro/status')
  status(@Query('transaction_id') transactionId: string) {
    return this.service.getStatus(transactionId);
  }
}

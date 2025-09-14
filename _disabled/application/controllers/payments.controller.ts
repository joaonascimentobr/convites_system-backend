import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from '../../domain/services/payments.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('payments')
export class PaymentsController {
  constructor(private pay: PaymentsService) {}

  @Post('pix')
  async createPix(@Body() b: { referenceId: string; description: string; amount: number }) {
    return this.pay.createPix(b.referenceId, b.description, b.amount);
  }

  @Post('card')
  async createCard(@Body() b: { referenceId: string; description: string; amount: number; cardToken: string }) {
    return this.pay.createCard(b.referenceId, b.description, b.amount, b.cardToken);
  }
}

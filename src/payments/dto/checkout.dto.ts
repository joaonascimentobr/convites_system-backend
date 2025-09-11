// src/payments/dto/checkout.dto.ts
import { IsEnum, IsInt, IsPositive } from 'class-validator';
export class CheckoutDto {
  @IsInt() orderId!: number;
  @IsInt() @IsPositive() amountCents!: number;
  @IsEnum(['pix','card'] as const) method!: 'pix'|'card';
}

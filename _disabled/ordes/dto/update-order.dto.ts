// src/orders/dto/update-order.dto.ts
import { IsEnum } from 'class-validator';
export class UpdateOrderDto {
  @IsEnum(['PENDING','PAID','CANCELED','GENERATED'] as const)
  status!: 'PENDING' | 'PAID' | 'CANCELED' | 'GENERATED';
}

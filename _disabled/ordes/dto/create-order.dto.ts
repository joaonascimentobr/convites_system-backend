// src/orders/dto/create-order.dto.ts
import { IsInt, IsPositive, IsString, MinLength } from 'class-validator';
export class CreateOrderDto {
  @IsString() @MinLength(2) name!: string;
  @IsInt() @IsPositive() age!: number;
  @IsString() @MinLength(3) address!: string;
  @IsString() themeSlug!: string;
}

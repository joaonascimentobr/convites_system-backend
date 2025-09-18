// src/payments/payment.types.ts
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client';

export type PaymentMethod = PrismaPaymentMethod; // <- alinha com o Prisma

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export type CheckoutInput = {
  orderId: string;
  amountCents: number;
  method: PaymentMethod ; // agora é o do Prisma
};

export type GatewayTx = {
  id: string;
  status: PaymentStatus;
  checkoutUrl?: string | null; // opcionais, se o gateway quiser retornar
  qrCode?: string | null;
};


export type CheckoutOutput = {
  id: string;
  status: PaymentStatus;
};

// src/payments/gateway/payment.gateway.ts
export type CheckoutInput = { orderId: number; amountCents: number; method: 'pix'|'card' };
export type CheckoutOutput = { transactionId: string; checkoutUrl?: string; qrCode?: string };

export abstract class PaymentGateway {
  abstract checkout(input: CheckoutInput): Promise<CheckoutOutput>;
  abstract getStatus(transactionId: string): Promise<{ status: string }>;
}

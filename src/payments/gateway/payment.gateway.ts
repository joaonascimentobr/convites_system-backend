// src/payments/gateway/payment.gateway.ts
export type CheckoutInput = { orderId: string; amountCents: number; method: 'PIX' | 'CARD' }
export type CheckoutOutput = { transactionId: string; checkoutUrl?: string; qrCode?: string }

export abstract class PaymentGateway {
  abstract checkout(input: CheckoutInput): Promise<CheckoutOutput>
  abstract getStatus?(transactionId: string): Promise<{ status: string }>
}

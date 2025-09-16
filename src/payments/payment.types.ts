// src/payments/payment.types.ts
export type PaymentMethod = 'PIX' | 'CARD'
export type PaymentStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_PAID'
  | 'PAYMENT_CANCELED'

export interface CheckoutInput {
  orderId: string
  amountCents: number
  method: PaymentMethod
}
export interface CheckoutOutput {
  transactionId: string
  checkoutUrl: string | null
  qrCode: string | null
}

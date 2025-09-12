// src/payments/payment.types.ts — Aliases para type-safety no app
export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'GENERATED'
export type PaymentStatus = 'PAYMENT_PENDING' | 'PAYMENT_AUTHORIZED' | 'PAYMENT_PAID' | 'PAYMENT_CANCELED'
export type PaymentMethod = 'PIX' | 'CARD'

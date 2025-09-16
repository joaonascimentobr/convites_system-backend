// src/payments/gateway/payment.gateway.ts
import { CheckoutInput, CheckoutOutput } from '../payment.types'

export interface PaymentGateway {
  checkout(input: CheckoutInput): Promise<CheckoutOutput>
}

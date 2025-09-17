// src/payments/payment.types.ts

export enum PaymentMethod {
  PIX = 'PIX',
  CARD = 'CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

/**
 * Entrada padrão usada pelo service/gateways
 */
export type CheckoutInput = {
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
};

/**
 * Resposta mínima vinda de um gateway de pagamento
 * (id da transação + status).
 */
export type GatewayTx = {
  id: string;
  status: PaymentStatus;
};

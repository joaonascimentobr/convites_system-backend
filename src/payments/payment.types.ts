export type PaymentMethod = 'PIX' | 'CARD';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  
}

export type CheckoutInput = {
  orderId: string;
  method: PaymentMethod;
};

export type GatewayTx = {
  id: string;
  orderId?: string | null;
  status: PaymentStatus;
  checkoutUrl?: string | null;
};

export type CheckoutOutput = {
  id: string;
  status: PaymentStatus;
};

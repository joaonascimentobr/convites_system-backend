export type PaymentMethod = 'PIX' | 'CARD';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  
}

export type CheckoutInput = {
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
};

export type GatewayTx = {
  id: string;
  status: PaymentStatus;
  checkoutUrl?: string | null;
  qrCodeUrl?: string | null;
};

export type CheckoutOutput = {
  id: string;
  status: PaymentStatus;
};
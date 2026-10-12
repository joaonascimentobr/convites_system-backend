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
  status: PaymentStatus;
  checkoutUrl?: string | null;
  qrCodeUrl?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
};

export type CheckoutOutput = {
  id: string;
  status: PaymentStatus;
};

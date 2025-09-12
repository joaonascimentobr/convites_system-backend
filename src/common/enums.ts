// apps/backend/src/common/enums.ts
export const ORDER_STATUSES = ['PENDING','AUTHORIZED','CANCELED','IN_ANALYSIS','PAID'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_METHODS = ['PIX','CARD'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const PAYMENT_STATUSES = ['PAYMENT_PENDING','PAYMENT_AUTHORIZED','PAYMENT_PAID','PAYMENT_CANCELED'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

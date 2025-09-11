// src/orders/entities/order.entity.ts
export type OrderStatus = 'PENDING'|'PAID'|'CANCELED'|'GENERATED';
export class Order {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public name: string,
    public age: number,
    public address: string,
    public themeSlug: string,
    public status: OrderStatus,
    public readonly createdAt: Date,
  ){}
}

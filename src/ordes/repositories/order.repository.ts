// src/orders/repositories/orders.repository.ts
import { Order } from '../entities/order.entity';

export abstract class OrdersRepository {
  abstract listByUser(userId: number): Promise<Order[]>;
  abstract findById(id: number, userId: number): Promise<Order | null>;
  abstract create(data: { userId:number; name:string; age:number; address:string; themeSlug:string }): Promise<Order>;
  abstract updateStatus(id: number, userId: number, status: Order['status']): Promise<Order>;
}

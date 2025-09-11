// src/orders/orders.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './repositories/orders.repository';

@Injectable()
export class OrdersService {
  constructor(private repo: OrdersRepository) {}

  list(userId: number) { return this.repo.listByUser(userId); }

  async get(id: number, userId: number) {
    const o = await this.repo.findById(id, userId);
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  create(input: { userId:number; name:string; age:number; address:string; themeSlug:string }) {
    return this.repo.create(input);
  }

  updateStatus(id: number, userId: number, status: 'PENDING'|'PAID'|'CANCELED'|'GENERATED') {
    return this.repo.updateStatus(id, userId, status);
  }
}

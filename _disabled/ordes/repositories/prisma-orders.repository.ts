// src/orders/repositories/prisma-orders.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrdersRepository } from './orders.repository';
import { Order } from '../entities/order.entity';

function map(row:any): Order {
  return new Order(row.id, row.userId, row.name, row.age, row.address, row.themeSlug, row.status, row.createdAt);
}

@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async listByUser(userId: number): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }});
    return rows.map(map);
  }

  async findById(id: number, userId: number): Promise<Order | null> {
    const row = await this.prisma.order.findFirst({ where: { id, userId }});
    return row ? map(row) : null;
  }

  async create(data: { userId:number; name:string; age:number; address:string; themeSlug:string }): Promise<Order> {
    const row = await this.prisma.order.create({ data: { ...data } });
    return map(row);
  }

  async updateStatus(id: number, userId: number, status: Order['status']): Promise<Order> {
    const exists = await this.findById(id, userId);
    if (!exists) throw new NotFoundException('Order not found');
    const row = await this.prisma.order.update({ where: { id }, data: { status }});
    return map(row);
  }
}

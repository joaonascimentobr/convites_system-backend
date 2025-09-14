// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersController } from './order.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './repositories/order.repository';
import { PrismaOrdersRepository } from './repositories/prisma-orders.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    { provide: OrdersRepository, useClass: PrismaOrdersRepository },
  ],
})
export class OrdersModule {}

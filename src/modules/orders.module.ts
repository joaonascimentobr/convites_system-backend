import { Module } from '@nestjs/common';
import { OrdersController } from '../application/controllers/orders.controller';
import { OrderService } from '../domain/services/order.service';
import { SlugService } from '../domain/services/slug.service';
import { InviteService } from '../domain/services/invite.service';
import { OrderPrismaRepository } from '../infrastructure/repositories/order.prisma.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    OrderService,
    SlugService,
    InviteService,
    { provide: 'IOrderRepository', useClass: OrderPrismaRepository },
  ],
  exports: [OrderService]
})
export class OrdersModule {}

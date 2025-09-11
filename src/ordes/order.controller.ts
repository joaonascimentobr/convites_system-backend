// src/orders/orders.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from '@/common/auth.guard';
import { CurrentUser } from '@/common/current-user.decorator';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Get() list(@CurrentUser() user: any) {
    return this.service.list(user.id);
  }

  @Get(':id') get(@Param('id', ParseIntPipe) id:number, @CurrentUser() user:any) {
    return this.service.get(id, user.id);
  }

  @Post() create(@Body() dto: CreateOrderDto, @CurrentUser() user:any) {
    return this.service.create({ userId: user.id, ...dto });
  }

  @Patch(':id') update(@Param('id', ParseIntPipe) id:number, @Body() dto: UpdateOrderDto, @CurrentUser() user:any) {
    return this.service.updateStatus(id, user.id, dto.status);
  }
}

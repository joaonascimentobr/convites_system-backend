import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.orders.list(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { name?: string; age?: number; address?: string; themeSlug?: string },
  ) {
    return this.orders.create({
      userId: user.sub,
      name: body.name,
      age: body.age,
      address: body.address,
      themeSlug: body.themeSlug,
    });
  }

  @Get(':id')
  get(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.orders.getById(user.sub, id);
  }

  @Post(':id/invite')
  generateInvite(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.orders.generateInvite(user.sub, id);
  }
}

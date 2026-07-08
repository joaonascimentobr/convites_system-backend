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
    @Body()
    body: {
      name?: string;
      age?: number;
      address?: string;
      zipCode?: string;
      street?: string;
      addressNumber?: string;
      neighborhood?: string;
      city?: string;
      stateCode?: string;
      complement?: string;
      referencePoint?: string;
      themeSlug?: string;
      giftIdeas?: string;
      possibleGuests?: Array<{ name?: string; age?: number }>;
    },
  ) {
    return this.orders.create({
      userId: user.sub,
      name: body.name,
      age: body.age,
      address: body.address,
      zipCode: body.zipCode,
      street: body.street,
      addressNumber: body.addressNumber,
      neighborhood: body.neighborhood,
      city: body.city,
      stateCode: body.stateCode,
      complement: body.complement,
      referencePoint: body.referencePoint,
      themeSlug: body.themeSlug,
      giftIdeas: body.giftIdeas,
      possibleGuests: body.possibleGuests,
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

import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrderService } from '../../domain/services/order.service';
import { InviteService } from '../../domain/services/invite.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrderService, private invites: InviteService) {}

  @Get()
  async mine(@Req() req: any) { const uid = Number(req.user.sub); return this.orders.listMine(uid); }

  @Post()
  async create(@Req() req: any, @Body() body: { theme: string; name: string; age: number; address: string; mp3Path?: string }) {
    const uid = Number(req.user.sub);
    return this.orders.create(uid, body);
  }

  @Get(':id')
  async getOne(@Req() req:any, @Param('id') id:string){
    const uid = Number(req.user.sub);
    const list = await this.orders.listMine(uid);
    return list.find(o => o.id === Number(id)) || null;
  }

  @Post(':id/generate')
  async generate(@Param('id') id: string) {
    await this.orders.markGenerated(Number(id));
    return { ok: true };
  }
}

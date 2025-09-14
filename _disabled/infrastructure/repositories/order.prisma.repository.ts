import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IOrderRepository } from '../../domain/repositories/order.repository';
import { Order } from '../../domain/entities/order.entity';
import { CreateOrderDTO } from '@convites/shared/src/dto/order.dto';

@Injectable()
export class OrderPrismaRepository implements IOrderRepository {
  constructor(private prisma: PrismaService){}

  async create(userId:number, data: CreateOrderDTO & { slug:string }): Promise<Order> {
    const o = await this.prisma.order.create({ data: { userId, ...data, status:'pending' } });
    return new Order(o.id,o.userId,o.theme,o.name,o.age,o.address,o.slug,o.status as any,o.mp3Path??null);
  }
  async findById(id:number){
    const o= await this.prisma.order.findUnique({ where:{ id } });
    return o? new Order(o.id,o.userId,o.theme,o.name,o.age,o.address,o.slug,o.status as any,o.mp3Path??null):null;
  }
  async findByUser(userId:number){
    const all= await this.prisma.order.findMany({ where:{ userId }, orderBy:{ id:'desc' } });
    return all.map(o=> new Order(o.id,o.userId,o.theme,o.name,o.age,o.address,o.slug,o.status as any,o.mp3Path??null));
  }
  async findBySlug(slug:string){
    const o= await this.prisma.order.findUnique({ where:{ slug } });
    return o? new Order(o.id,o.userId,o.theme,o.name,o.age,o.address,o.slug,o.status as any,o.mp3Path??null):null;
  }
  async updateStatus(id:number, status:string){ await this.prisma.order.update({ where:{ id }, data:{ status } }); }
}

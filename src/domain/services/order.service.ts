import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository } from '../repositories/order.repository';
import { CreateOrderDTO } from '@convites/shared/src/dto/order.dto';
import { SlugService } from './slug.service';
@Injectable()
export class OrderService {
  constructor(@Inject('IOrderRepository') private repo:IOrderRepository, private slugs: SlugService){}
  async create(userId:number, data:CreateOrderDTO){ const slug= await this.slugs.uniqueSlug(10); return this.repo.create(userId,{...data,slug}); }
  listMine(userId:number){ return this.repo.findByUser(userId); }
  markPaid(id:number){ return this.repo.updateStatus(id,'paid'); }
  markGenerated(id:number){ return this.repo.updateStatus(id,'generated'); }
}

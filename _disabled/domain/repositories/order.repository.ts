import { Order } from '../entities/order.entity';
import { CreateOrderDTO } from '@convites/shared/src/dto/order.dto';
export interface IOrderRepository {
  create(userId:number, data: CreateOrderDTO & { slug:string }): Promise<Order>;
  findById(id:number):Promise<Order|null>;
  findByUser(userId:number):Promise<Order[]>;
  findBySlug(slug:string):Promise<Order|null>;
  updateStatus(id:number, status:string):Promise<void>;
}

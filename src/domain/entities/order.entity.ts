import type { OrderStatus } from '@convites/shared/src/types';
export class Order {
  constructor(
    public id:number,
    public userId:number,
    public theme:string,
    public name:string,
    public age:number,
    public address:string,
    public slug:string,
    public status:OrderStatus,
    public mp3Path?:string|null
  ){}
}

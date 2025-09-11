import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
@Injectable()
export class SlugService {
  constructor(private prisma: PrismaService){}
  async uniqueSlug(len=10){
    for(let i=0;i<20;i++){
      const slug=randomBytes(Math.ceil(len/2)).toString('hex').slice(0,len);
      const ex= await this.prisma.order.findUnique({ where:{ slug } });
      if(!ex) return slug;
    }
    return randomBytes(8).toString('hex');
  }
}

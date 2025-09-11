import { PrismaClient } from '@prisma/client';
import themes from './themes.seed.json' assert { type: 'json' };
const prisma = new PrismaClient();
async function main(){
  for(const t of themes){
    await prisma.theme.upsert({ where: { key: t.key }, update: {}, create: t });
  }
}
main().finally(()=>prisma.$disconnect());

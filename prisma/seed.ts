// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.theme.upsert({ where: { slug: 'mario' },    update: {}, create: { slug: 'mario',    title: 'Super Mario' }});
  await prisma.theme.upsert({ where: { slug: 'futebol' },  update: {}, create: { slug: 'futebol',  title: 'Futebol' }});
  await prisma.theme.upsert({ where: { slug: 'unicórnio' },update: {}, create: { slug: 'unicórnio',title: 'Unicórnio' }});
}

main().finally(() => prisma.$disconnect());

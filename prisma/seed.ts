/// <reference types="node" />
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'demo@convites.local' },
    update: {},
    create: {
      email: 'demo@convites.local',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
      name: 'Demo',
    },
  })

  const themes = [
    { name: 'Super Mario', slug: 'super-mario', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Futebol', slug: 'futebol', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Unicornio', slug: 'unicornio', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Homem-Aranha', slug: 'homem-aranha', bgUrl: null, musicUrl: null, fontUrl: null },
  ]

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { slug: theme.slug },
      update: theme,
      create: theme,
    })
  }

  console.log('Seed executada. Usuario demo: demo@convites.local')
}

main().finally(async () => prisma.$disconnect())

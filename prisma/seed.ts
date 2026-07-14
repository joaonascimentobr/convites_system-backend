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
    { name: 'Aquaman', slug: 'aquaman', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Aranhaverso', slug: 'aranhaverso', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Batman', slug: 'batman', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Capitão América', slug: 'capitao-america', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Flash', slug: 'flash', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Guardiões da Galáxia', slug: 'guardioes-da-galaxia', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Homem de Ferro', slug: 'homem-de-ferro', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Homem-Aranha', slug: 'homem-aranha', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Hulk', slug: 'hulk', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Jovens Titãs', slug: 'jovens-titans', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Ladybug', slug: 'ladybug', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Liga da Justiça', slug: 'liga-da-justica', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Miles Morales', slug: 'miles-morales', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Mulher-Maravilha', slug: 'mulher-maravilha', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Os Incríveis', slug: 'os-incriveis', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Pantera Negra', slug: 'pantera-negra', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'PJ Masks', slug: 'pj-masks', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Superman', slug: 'superman', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Thor', slug: 'thor', bgUrl: null, musicUrl: null, fontUrl: null },
    { name: 'Vingadores', slug: 'vingadores', bgUrl: null, musicUrl: null, fontUrl: null },
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

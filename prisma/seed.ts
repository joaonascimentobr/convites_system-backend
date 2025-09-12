/// <reference types="node" />
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  // cria usuário demo
  const user = await prisma.user.upsert({
    where: { email: 'demo@convites.local' },
    update: {},
    create: { email: 'demo@convites.local', passwordHash: '$2a$10$abcdefghijklmnopqrstuv', name: 'Demo' },
  })

  // temas
  const themes = [
    { name: 'Super Mario', slug: 'super-mario', bgUrl: null, musicUrl: null },
    { name: 'Futebol', slug: 'futebol', bgUrl: null, musicUrl: null },
    { name: 'Unicórnio', slug: 'unicornio', bgUrl: null, musicUrl: null },
  ]
  for (const t of themes) {
    await prisma.theme.upsert({ where: { slug: t.slug }, update: t, create: t })
  }

  console.log('Seed executada. Usuário demo: demo@convites.local')
}

main().finally(async () => prisma.$disconnect())

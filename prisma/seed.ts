/// <reference types="node" />

import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

type ThemeSeed = {
  name: string;
  slug: string;
  bgUrl?: string | null;
  musicUrl?: string | null;
};

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const file = join(__dirname, 'themes.seed.json');
  const items = JSON.parse(readFileSync(file, 'utf8')) as ThemeSeed[];

  for (const t of items) {
    await prisma.theme.upsert({
      where: { slug: t.slug }, // << agora existe no WhereUnique
      update: {
        name: t.name,
        bgUrl: t.bgUrl ?? null,
        musicUrl: t.musicUrl ?? null,
      },
      create: {
        name: t.name,
        slug: t.slug,
        bgUrl: t.bgUrl ?? null,
        musicUrl: t.musicUrl ?? null,
      },
    });
  }
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

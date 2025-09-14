// src/themes/repositories/prisma-themes.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ThemesRepository } from './themes.repository';
import { Theme } from '../entities/theme.entity';

@Injectable()
export class PrismaThemesRepository implements ThemesRepository {
  constructor(private prisma: PrismaService) {}
  async list(): Promise<Theme[]> {
    const rows = await this.prisma.theme.findMany({ orderBy: { title: 'asc' } });
    return rows.map((t) => new Theme(t.slug, t.title));
  }
}

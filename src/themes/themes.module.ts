// src/themes/themes.module.ts
import { Module } from '@nestjs/common';
import { ThemesController } from './themes.controller';
import { ThemesService } from './themes.service';
import { ThemesRepository } from './repositories/themes.repository';
import { PrismaThemesRepository } from './repositories/prisma-themes.repository';

@Module({
  controllers: [ThemesController],
  providers: [
    ThemesService,
    { provide: ThemesRepository, useClass: PrismaThemesRepository },
  ],
})
export class ThemesModule {}

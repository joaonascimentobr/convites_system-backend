// src/themes/themes.service.ts
import { Injectable } from '@nestjs/common';
import { ThemesRepository } from './repositories/themes.repository';
@Injectable()
export class ThemesService {
  constructor(private repo: ThemesRepository) {}
  list() { return this.repo.list(); }
}

// src/themes/themes.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ThemesService } from './themes.service';

@Controller('themes')
export class ThemesController {
  constructor(private service: ThemesService) {}
  @Get() list() { return this.service.list(); }
}

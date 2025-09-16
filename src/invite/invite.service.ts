// src/invite/invite.service.ts
import { Injectable } from '@nestjs/common';
import Mustache from 'mustache';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class InviteService {
  async render(order: any) {
    const theme = order.theme ?? {};
    const html = Mustache.render(
      `<html>
        <head>{{#theme.fontUrl}}<link href="{{theme.fontUrl}}" rel="stylesheet">{{/theme.fontUrl}}</head>
        <body style="background:url('{{theme.bgUrl}}') center/cover no-repeat">
          <h1>{{name}} - {{age}} anos</h1>
          <p>{{address}}</p>
        </body>
      </html>`,
      { ...order, theme },
    );

    const outDir = join(process.cwd(), 'public', 'invites', order.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf8');
    return { path: `/invites/${order.slug}/index.html` };
  }
}

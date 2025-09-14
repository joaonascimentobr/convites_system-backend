import { Injectable } from '@nestjs/common';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
@Injectable()
export class InviteService {
  private outDir = join(process.cwd(), 'public','i');
  async renderToHtml(p:{ slug:string; name:string; age:number; address:string; theme:string; mp3Path?:string|null; baseUrl:string; }){
    await mkdir(this.outDir,{recursive:true});
    const tplPath= join(process.cwd(),'templates','invite_template.html');
    let html = await readFile(tplPath,'utf-8').catch(()=>`<!doctype html><meta charset="utf-8"><title>Convite</title><h1>{{nome}} ({{idade}})</h1><p>{{endereco}}</p>`);
    const m = new Map<string,string>([
      ['{{nome}}',p.name],
      ['{{idade}}',String(p.age)],
      ['{{endereco}}',p.address],
      ['{{url_convite}}',`${p.baseUrl}/i/${p.slug}.html`],
      ['{{som_musica}}', p.mp3Path?`<audio controls autoplay loop src="../uploads/${p.mp3Path}"></audio>`:'']
    ]);
    m.forEach((v,k)=> html = html.split(k).join(v));
    const out = join(this.outDir, `${p.slug}.html`);
    await writeFile(out, html, 'utf-8');
    return out;
  }
}

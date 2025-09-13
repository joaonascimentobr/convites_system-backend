import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import { join } from 'path'
import Mustache from 'mustache'

const prisma = new PrismaClient()

@Injectable()
export class InviteService {
  private templatePath = join(process.cwd(), 'templates', 'invite_template.html')
  private outDir = join(process.cwd(), 'public', 'i')

  async generateForOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { theme: true, user: true },
    })
    if (!order) throw new Error('Order not found')

    // garante slug
    const slug = order.slug || this.slugify(`${order.name}-${order.age}-${order.id.slice(0,6)}`)
    if (!order.slug) {
      await prisma.order.update({ where: { id: order.id }, data: { slug } })
    }

    // dados do tema
    const bgUrl = order.theme?.bgUrl ?? ''
    const musicUrl = order.theme?.musicUrl ?? ''
    const fontUrl = order.theme?.fontUrl ?? ''

    // lê template
    const tpl = await fs.readFile(this.templatePath, 'utf-8')
    const urlConvite = `${process.env.BASE_URL?.replace(/\/$/, '') || ''}/i/${slug}.html`
    const html = Mustache.render(tpl, {
      nome: order.name,
      idade: order.age,
      endereco: order.address,
      bgUrl, musicUrl, fontUrl,
      url_convite: urlConvite,
    })

    await fs.mkdir(this.outDir, { recursive: true })
    const outFile = join(this.outDir, `${slug}.html`)
    await fs.writeFile(outFile, html, 'utf-8')

    // marca como GERADO (opcional)
    await prisma.order.update({ where: { id: order.id }, data: { status: 'GENERATED' } })

    return { slug, url: urlConvite, file: outFile }
  }

  private slugify(s: string) {
    return s
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
  }
}

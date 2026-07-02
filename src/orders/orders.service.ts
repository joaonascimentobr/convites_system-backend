import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InviteService } from '../invite/invite.service';
import { PrismaService } from '../prisma/prisma.service';

type CreateOrderInput = {
  userId: string;
  name?: string;
  age?: number;
  address?: string;
  themeSlug?: string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inviteService: InviteService,
  ) {}

  async list(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { theme: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async create(input: CreateOrderInput) {
    const name = this.requireString(input.name, 'Nome é obrigatório');
    const address = this.requireString(input.address, 'Endereço é obrigatório');
    const age = this.normalizeAge(input.age);
    const theme = await this.findTheme(input.themeSlug);
    const slug = await this.generateUniqueSlug(name);

    const order = await this.prisma.order.create({
      data: {
        userId: input.userId,
        name,
        age,
        address,
        slug,
        themeId: theme?.id,
        status: 'PENDING',
        amountCents: 1990,
      },
      include: { theme: true, payment: true },
    });

    return this.serializeOrder(order);
  }

  async getById(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { theme: true, payment: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.serializeOrder(order);
  }

  async generateInvite(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { theme: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const rendered = await this.inviteService.render(order);

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'GENERATED' },
    });

    return rendered;
  }

  private serializeOrder(order: {
    id: string;
    name: string;
    age: number;
    address: string;
    slug: string;
    status: string;
    amountCents: number | null;
    createdAt: Date;
    updatedAt: Date;
    theme: { slug: string; name: string } | null;
    payment?: { status: string } | null;
  }) {
    return {
      id: order.id,
      name: order.name,
      age: order.age,
      address: order.address,
      slug: order.slug,
      status: order.status,
      amountCents: order.amountCents,
      themeSlug: order.theme?.slug ?? '',
      themeName: order.theme?.name ?? null,
      paymentStatus: order.payment?.status ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private async findTheme(rawThemeSlug?: string) {
    const normalized = this.normalizeThemeSlug(rawThemeSlug);
    if (!normalized) {
      return null;
    }

    return this.prisma.theme.findUnique({
      where: { slug: normalized },
    });
  }

  private normalizeThemeSlug(themeSlug?: string) {
    if (typeof themeSlug !== 'string' || !themeSlug.trim()) {
      return null;
    }

    const normalized = themeSlug
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const aliases: Record<string, string> = {
      mario: 'super-mario',
      'super mario': 'super-mario',
      'super-mario': 'super-mario',
      futebol: 'futebol',
      unicornio: 'unicornio',
    };

    return aliases[normalized] ?? normalized;
  }

  private normalizeAge(age?: number) {
    if (!Number.isInteger(age) || Number(age) <= 0) {
      throw new BadRequestException('Idade inválida');
    }

    return Number(age);
  }

  private requireString(value: string | undefined, message: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(message);
    }

    return value.trim();
  }

  private async generateUniqueSlug(name: string) {
    const base = name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'convite';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = Math.random().toString(36).slice(2, 8);
      const slug = `${base}-${suffix}`;
      const existing = await this.prisma.order.findUnique({ where: { slug } });
      if (!existing) {
        return slug;
      }
    }

    throw new BadRequestException('Não foi possível gerar o link do convite');
  }
}

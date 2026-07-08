import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InviteService } from '../invite/invite.service';
import { PrismaService } from '../prisma/prisma.service';

type CreateOrderInput = {
  userId: string;
  name?: string;
  age?: number;
  address?: string;
  themeSlug?: string;
  giftIdeas?: string;
  possibleGuests?: Array<{ name?: string; age?: number }>;
};

type SerializedGuest = {
  name: string;
  age: number;
};

type ThemeCatalogItem = {
  name: string;
  slug: string;
  bgUrl: string | null;
  musicUrl: string | null;
  fontUrl: string | null;
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
    const name = this.requireString(input.name, 'Nome e obrigatorio');
    const address = this.requireString(input.address, 'Endereco e obrigatorio');
    const age = this.normalizeAge(input.age);
    const theme = await this.findTheme(input.themeSlug);
    const slug = await this.generateUniqueSlug(name);
    const giftIdeas = this.normalizeGiftIdeas(input.giftIdeas);
    const possibleGuests = this.normalizePossibleGuests(input.possibleGuests);

    const order = await this.prisma.order.create({
      data: {
        userId: input.userId,
        name,
        age,
        address,
        giftIdeas,
        possibleGuests: JSON.stringify(possibleGuests),
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
      throw new NotFoundException('Pedido nao encontrado');
    }

    return this.serializeOrder(order);
  }

  async generateInvite(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { theme: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
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
    giftIdeas: string;
    possibleGuests: string;
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
      giftIdeas: order.giftIdeas,
      possibleGuests: this.parsePossibleGuests(order.possibleGuests),
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

    const catalogItem = this.getThemeCatalog()[normalized];
    if (catalogItem) {
      return this.prisma.theme.upsert({
        where: { slug: catalogItem.slug },
        update: catalogItem,
        create: catalogItem,
      });
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
      'homem aranha': 'homem-aranha',
      'homem-aranha': 'homem-aranha',
      spiderman: 'homem-aranha',
      'spider-man': 'homem-aranha',
    };

    return aliases[normalized] ?? normalized;
  }

  private normalizeAge(age?: number, message = 'Idade invalida') {
    if (!Number.isInteger(age) || Number(age) <= 0) {
      throw new BadRequestException(message);
    }

    return Number(age);
  }

  private requireString(value: string | undefined, message: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(message);
    }

    return value.trim();
  }

  private normalizeGiftIdeas(value?: string) {
    if (typeof value !== 'string') {
      return '';
    }

    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join('\n');
  }

  private normalizePossibleGuests(possibleGuests?: Array<{ name?: string; age?: number }>) {
    if (!Array.isArray(possibleGuests)) {
      return [] as SerializedGuest[];
    }

    return possibleGuests
      .map((guest, index) => {
        const name = typeof guest?.name === 'string' ? guest.name.trim() : '';
        const age = guest?.age;

        if (!name && (age === undefined || age === null || age === 0)) {
          return null;
        }

        if (!name) {
          throw new BadRequestException(`Nome do convidado ${index + 1} e obrigatorio`);
        }

        return {
          name,
          age: this.normalizeAge(age, `Idade do convidado ${index + 1} invalida`),
        };
      })
      .filter((guest): guest is SerializedGuest => Boolean(guest));
  }

  private parsePossibleGuests(rawValue: string) {
    if (!rawValue) {
      return [] as SerializedGuest[];
    }

    try {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) {
        return [] as SerializedGuest[];
      }

      return parsed
        .map((guest) => ({
          name: typeof guest?.name === 'string' ? guest.name.trim() : '',
          age: Number(guest?.age),
        }))
        .filter((guest) => guest.name && Number.isInteger(guest.age) && guest.age > 0);
    } catch {
      return [] as SerializedGuest[];
    }
  }

  private getThemeCatalog(): Record<string, ThemeCatalogItem> {
    return {
      'super-mario': {
        name: 'Super Mario',
        slug: 'super-mario',
        bgUrl: null,
        musicUrl: null,
        fontUrl: null,
      },
      futebol: {
        name: 'Futebol',
        slug: 'futebol',
        bgUrl: null,
        musicUrl: null,
        fontUrl: null,
      },
      unicornio: {
        name: 'Unicornio',
        slug: 'unicornio',
        bgUrl: null,
        musicUrl: null,
        fontUrl: null,
      },
      'homem-aranha': {
        name: 'Homem-Aranha',
        slug: 'homem-aranha',
        bgUrl: null,
        musicUrl: null,
        fontUrl: null,
      },
    };
  }

  private async generateUniqueSlug(name: string) {
    const base =
      name
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

    throw new BadRequestException('Nao foi possivel gerar o link do convite');
  }
}

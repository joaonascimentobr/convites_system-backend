import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InviteService } from '../invite/invite.service';
import { PrismaService } from '../prisma/prisma.service';

type CreateOrderInput = {
  userId: string;
  name?: string;
  age?: number;
  address?: string;
  zipCode?: string;
  street?: string;
  addressNumber?: string;
  neighborhood?: string;
  city?: string;
  stateCode?: string;
  complement?: string;
  referencePoint?: string;
  inviteImageUrl?: string;
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

type NormalizedAddress = {
  address: string;
  zipCode: string;
  street: string;
  addressNumber: string;
  neighborhood: string;
  city: string;
  stateCode: string;
  complement: string;
  referencePoint: string;
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
    const age = this.normalizeAge(input.age);
    const normalizedAddress = this.normalizeAddress(input);
    const theme = await this.findTheme(input.themeSlug);
    const slug = await this.generateUniqueSlug(name);
    const inviteImageUrl = this.normalizeInviteImage(input.inviteImageUrl);
    const giftIdeas = this.normalizeGiftIdeas(input.giftIdeas);
    const possibleGuests = this.normalizePossibleGuests(input.possibleGuests);

    const order = await this.prisma.order.create({
      data: {
        userId: input.userId,
        name,
        age,
        address: normalizedAddress.address,
        zipCode: normalizedAddress.zipCode,
        street: normalizedAddress.street,
        addressNumber: normalizedAddress.addressNumber,
        neighborhood: normalizedAddress.neighborhood,
        city: normalizedAddress.city,
        stateCode: normalizedAddress.stateCode,
        complement: normalizedAddress.complement,
        referencePoint: normalizedAddress.referencePoint,
        inviteImageUrl,
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
    zipCode: string;
    street: string;
    addressNumber: string;
    neighborhood: string;
    city: string;
    stateCode: string;
    complement: string;
    referencePoint: string;
    inviteImageUrl: string;
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
      zipCode: order.zipCode,
      street: order.street,
      addressNumber: order.addressNumber,
      neighborhood: order.neighborhood,
      city: order.city,
      stateCode: order.stateCode,
      complement: order.complement,
      referencePoint: order.referencePoint,
      inviteImageUrl: order.inviteImageUrl,
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

  private normalizeAddress(input: CreateOrderInput): NormalizedAddress {
    const street = this.normalizeOptionalString(input.street);
    const city = this.normalizeOptionalString(input.city);
    const stateCode = this.normalizeOptionalString(input.stateCode).toUpperCase();

    if (street || city || stateCode) {
      const zipCode = this.normalizeZipCode(input.zipCode);
      const addressNumber = this.requireString(input.addressNumber, 'Número é obrigatório');
      const neighborhood = this.requireString(input.neighborhood, 'Bairro é obrigatório');
      const normalizedStreet = this.requireString(input.street, 'Rua é obrigatória');
      const normalizedCity = this.requireString(input.city, 'Cidade é obrigatória');
      const normalizedStateCode = this.normalizeStateCode(input.stateCode);
      const complement = this.normalizeOptionalString(input.complement);
      const referencePoint = this.normalizeOptionalString(input.referencePoint);

      return {
        address: this.formatAddress({
          zipCode,
          street: normalizedStreet,
          addressNumber,
          neighborhood,
          city: normalizedCity,
          stateCode: normalizedStateCode,
          complement,
          referencePoint,
        }),
        zipCode,
        street: normalizedStreet,
        addressNumber,
        neighborhood,
        city: normalizedCity,
        stateCode: normalizedStateCode,
        complement,
        referencePoint,
      };
    }

    const address = this.requireString(input.address, 'Endereço é obrigatório');

    return {
      address,
      zipCode: '',
      street: '',
      addressNumber: '',
      neighborhood: '',
      city: '',
      stateCode: '',
      complement: '',
      referencePoint: '',
    };
  }

  private normalizeZipCode(value?: string) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length !== 8) {
      throw new BadRequestException('CEP inválido');
    }

    return digits;
  }

  private normalizeStateCode(value?: string) {
    const normalized = this.requireString(value, 'UF é obrigatória').toUpperCase();
    if (normalized.length !== 2) {
      throw new BadRequestException('UF inválida');
    }

    return normalized;
  }

  private formatAddress(address: Omit<NormalizedAddress, 'address'>) {
    const lines = [
      `${address.street}, ${address.addressNumber}`,
      `${address.neighborhood} • ${address.city} - ${address.stateCode}`,
      `CEP: ${this.formatZipCode(address.zipCode)}`,
    ];

    if (address.complement) {
      lines.push(`Complemento: ${address.complement}`);
    }

    if (address.referencePoint) {
      lines.push(`Referência: ${address.referencePoint}`);
    }

    return lines.join('\n');
  }

  private formatZipCode(value: string) {
    return `${value.slice(0, 5)}-${value.slice(5)}`;
  }

  private normalizeAge(age?: number, message = 'Idade inválida') {
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

  private normalizeOptionalString(value?: string) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeInviteImage(value?: string) {
    const normalized = this.normalizeOptionalString(value);
    if (!normalized) {
      return '';
    }

    const isDataUrl = /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(normalized);
    if (!isDataUrl) {
      throw new BadRequestException('Imagem do convite inválida');
    }

    if (normalized.length > 5_000_000) {
      throw new BadRequestException('Imagem do convite excede o tamanho permitido');
    }

    return normalized;
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
          throw new BadRequestException(`Nome do convidado ${index + 1} é obrigatório`);
        }

        return {
          name,
          age: this.normalizeAge(age, `Idade do convidado ${index + 1} inválida`),
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
        name: 'Unicórnio',
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

    throw new BadRequestException('Não foi possível gerar o link do convite');
  }
}

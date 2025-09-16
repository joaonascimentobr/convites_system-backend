// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    try {
      await this.$queryRaw`PRAGMA journal_mode = WAL`;
    } catch {}
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication) {
    const cleanup = async () => await app.close();
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}

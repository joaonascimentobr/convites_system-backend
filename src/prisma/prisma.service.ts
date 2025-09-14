// apps/backend/src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
    try { await this.$executeRawUnsafe('PRAGMA journal_mode = WAL') } catch {}
  }
  async enableShutdownHooks(app: INestApplication) {
    (this as any).$on('beforeExit', async () => { await app.close() })
  }
}

import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
    try { await this.$queryRawUnsafe('PRAGMA journal_mode = WAL') } catch {}
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  // Nada de this.$on('beforeExit') no engine "library"
  async enableShutdownHooks(app: INestApplication) {
    const cleanup = async () => { await app.close() }
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.on('beforeExit', cleanup)
  }
}

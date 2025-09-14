import 'reflect-metadata'            // <- tem que ser a primeira linha
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PrismaService } from './prisma/prisma.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  const prisma = app.get(PrismaService)
  await prisma.enableShutdownHooks(app)
  const port = Number(process.env.PORT || 3000)
  await app.listen(port)
  console.log(`[API] online em http://localhost:${port}`)
}
bootstrap()

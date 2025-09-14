import 'reflect-metadata'            // <- tem que ser a primeira linha
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  const port = Number(process.env.PORT || 3000)
  await app.listen(port)
  console.log(`[API] online em http://localhost:${port}`)
}
bootstrap()

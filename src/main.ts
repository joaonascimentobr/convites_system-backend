// apps/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // raw body só no webhook
  app.use(
    '/payments/pagseguro/notify',
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  const port = parseInt(process.env.PORT ?? '3000', 10); // <<< deixe só esta linha
  await app.listen(port, '0.0.0.0');
}
bootstrap();

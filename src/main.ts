// src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express, { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Capturar o raw body SOMENTE no webhook (para HMAC)
  app.use(
    '/payments/pagseguro/notify',
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res: Response, buf: Buffer) => {
        (req as any).rawBody = buf;
      },
    }),
  );

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
}
bootstrap();

# Convites Backend

API NestJS com Prisma, MySQL, autenticação JWT e integração de pagamentos PIX do Mercado Pago.

## Requisitos

- Node.js 24 LTS
- PNPM 9.12.2

## Desenvolvimento

```bash
pnpm install
pnpm prisma:gen
pnpm prisma:migrate
pnpm exec prisma db seed
pnpm start:dev
```

A API inicia por padrão em `http://localhost:3000` e expõe `GET /health`.

Copie `.env.example` para `.env` e ajuste as credenciais locais antes de iniciar.

// src/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().url(),

  // segurança do webhook
  PAGSEGURO_WEBHOOK_TOKEN: z.string(),
  PAGSEGURO_HMAC_SECRET: z.string().optional(),

  // demais configs
  PAGSEGURO_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  BASE_URL: z.string().url().optional(),
})

let cached: z.infer<typeof envSchema> | null = null

export function env() {
  if (!cached) cached = envSchema.parse(process.env)
  return cached
}
export type Env = z.infer<typeof envSchema>

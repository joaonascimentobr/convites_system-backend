import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  PAGSEGURO_ENV: z.enum(['sandbox','production']).default('sandbox'),
  PAGSEGURO_TOKEN: z.string().optional(),
  BASE_URL: z.string().url().optional(),
});
export type Env = z.infer<typeof envSchema>;

// src/common/findOrCreate.ts
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function findOrCreate<T>(
  find: () => Promise<T | null>,
  create: () => Promise<T>,
) {
  const existing = await find();
  if (existing) return existing;

  try {
    return await create();
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
      const after = await find();
      if (after) return after;
    }
    throw e;
  }
}

import { prisma } from "@repo/db";

import { apiEnv } from "../env";
import { tooManyRequests } from "../errors";

const windowStartOf = (now: Date, windowSeconds: number) =>
  new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);

// Ventana fija por clave: el contador vive en Postgres porque las funciones de Vercel no
// comparten memoria. El upsert es atómico, así dos pedidos concurrentes no se pisan.
export const consumeRateLimit = async (
  key: string,
  limit: number,
  windowSeconds: number,
  now = new Date(),
) => {
  if (!apiEnv.rateLimitEnabled) return;
  const windowStart = windowStartOf(now, windowSeconds);
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > limit) {
    throw tooManyRequests("Demasiados intentos. Esperá un momento y volvé a probar.");
  }
};

const bucketRetentionDays = 2;

export const purgeRateLimitBuckets = async (now = new Date()) => {
  const threshold = new Date(now.getTime() - bucketRetentionDays * 24 * 60 * 60 * 1000);
  const { count } = await prisma.rateLimitBucket.deleteMany({
    where: { windowStart: { lt: threshold } },
  });
  return count;
};

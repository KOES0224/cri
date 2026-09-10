import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
/** Atomic database limit: no per-process state or raw email/IP storage. */
export async function allowRequest(scope: string, identifier: string, max: number, seconds: number): Promise<boolean> {
  const key = createHash('sha256').update(`${scope}:${identifier}`).digest('hex');
  const resetAt = new Date(Date.now() + seconds * 1000);
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RequestLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RequestLimit"."resetAt" <= NOW() THEN 1 ELSE "RequestLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RequestLimit"."resetAt" <= NOW() THEN ${resetAt} ELSE "RequestLimit"."resetAt" END
    RETURNING "count"`;
  return rows[0].count <= max;
}

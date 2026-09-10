import { PrismaClient } from '@prisma/client'

function getDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) return undefined

  try {
    const parsed = new URL(rawUrl)
    // If connected to Supabase pooler on session port 5432, switch to transaction pooler port 6543
    if (parsed.port === '5432' && parsed.hostname.includes('pooler.supabase.com')) {
      parsed.port = '6543'
      parsed.searchParams.set('pgbouncer', 'true')
      parsed.searchParams.set('connection_limit', '1')
      return parsed.toString()
    }
    return rawUrl
  } catch {
    return rawUrl
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const dbUrl = getDatabaseUrl()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


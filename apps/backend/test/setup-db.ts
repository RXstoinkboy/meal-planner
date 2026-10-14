import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach } from 'vitest'

import { env } from '@/core/config/env'
import { PrismaClient } from '@/generated/prisma/client'

function databaseNameOf(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).pathname
  } catch {
    throw new Error('DATABASE_URL must be a valid postgres:// URL')
  }
}

const databaseName = databaseNameOf(env.DATABASE_URL)
const isTestDatabase = databaseName.endsWith('_test')

if (!isTestDatabase) {
  throw new Error(`Refusing to truncate "${databaseName}" — tests need a *_test database`)
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) })

// HTTP requests cannot share an interactive transaction, so reset between tests.
// users cascade to recipes and their children.
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
})

afterAll(async () => {
  await prisma.$disconnect()
})

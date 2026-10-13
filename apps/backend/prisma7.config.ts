// Prisma 7 reads connection config from here, not from the datasource block.
// `dotenv/config` loads `.env`; DATABASE_URL can still be overridden per command.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
})

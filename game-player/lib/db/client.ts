import 'server-only'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export function getDb() {
  if (!globalThis.__playerDbPool) {
    globalThis.__playerDbPool = new Pool({
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      port: Number(process.env.PGPORT),
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      ssl: process.env.PGSSLMODE !== 'disable',
    })
  }

  if (!globalThis.__playerDb) {
    globalThis.__playerDb = drizzle(globalThis.__playerDbPool, { schema })
  }

  return globalThis.__playerDb!
}

export type PlayerDb = ReturnType<typeof getDb>
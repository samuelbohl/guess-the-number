import 'server-only'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'
import { databaseConfig } from '@/lib/config'

export function getDb() {
  if (!globalThis.__playerDbPool) {
    globalThis.__playerDbPool = new Pool(databaseConfig)
  }

  if (!globalThis.__playerDb) {
    globalThis.__playerDb = drizzle(globalThis.__playerDbPool, { schema })
  }

  return globalThis.__playerDb!
}

export type PlayerDb = ReturnType<typeof getDb>
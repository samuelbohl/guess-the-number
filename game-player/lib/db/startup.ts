import 'server-only'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'node:path'
import fs from 'node:fs'
import { getDb } from './client'

export async function ensureMigrationsApplied(): Promise<void> {
  if (globalThis.__playerDbMigrationsApplied) return

  const migrationsFolder = path.join(process.cwd(), 'drizzle')
  const hasMigrationsFolder = fs.existsSync(migrationsFolder)

  if (!hasMigrationsFolder) {
    // No migrations yet; skip but mark as done to avoid repeated checks
    globalThis.__playerDbMigrationsApplied = true
    return
  }

  const db = getDb()
  console.log('Applying migrations...')
  await migrate(db, { migrationsFolder })
  globalThis.__playerDbMigrationsApplied = true
}
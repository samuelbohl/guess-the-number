import fp from 'fastify-plugin'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import * as path from 'node:path'
import * as schema from '../db/schema.js'

export default fp(async (fastify, _opts) => {
  // Toggle SSL based on PGSSLMODE (set to 'disable' for local dev)
  const sslMode = (process.env.PGSSLMODE ?? '').toLowerCase()
  const sslOption = sslMode && sslMode !== 'disable' ? { rejectUnauthorized: false } : false

  const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    ssl: sslOption
  })

  const db = drizzle(pool, { schema })

  // Apply migrations automatically on startup
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') })

  fastify.decorate('db', db)
  fastify.decorate('pgPool', pool)

  fastify.addHook('onClose', async () => {
    await pool.end()
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>
    pgPool: Pool
  }
}
import fp from 'fastify-plugin'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'


export default fp(async (fastify, _opts) => {
  const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }
  })

  const db = drizzle(pool)

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
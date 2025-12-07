import { FastifyPluginAsync } from 'fastify'
import { sql } from 'drizzle-orm'

const health: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { status: 'ok', uptime: process.uptime() }
  })

  fastify.get('/db', async function (request, reply) {
    let dbStatus = 'unknown'
    try {
      await fastify.db.execute(sql`select 1`)
      dbStatus = 'connected'
    } catch (_err) {
      dbStatus = 'error'
    }

    return { status: 'ok', db: dbStatus }
  })
}

export default health
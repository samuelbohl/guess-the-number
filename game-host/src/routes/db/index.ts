import { FastifyPluginAsync } from 'fastify'

const dbRoutes: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.get('/migrations', async (_request, _reply) => {
    const result = await fastify.pgPool.query(
      `
      SELECT *
      FROM "drizzle"."__drizzle_migrations"
      ORDER BY 1
      `
    )

    return result.rows
  })
}

export default dbRoutes
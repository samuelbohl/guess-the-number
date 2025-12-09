import { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema.js';

const cronRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/cleanup',
    {
      schema: {
        description: 'Cleanup completed games',
        response: {
          200: {
            type: 'object',
            properties: {
              deletedCount: { type: 'number' },
            },
            required: ['deletedCount'],
          },
        },
      },
    },
    async () => {
      const deleted = await fastify.db
        .delete(schema.games)
        .where(eq(schema.games.status, 'completed'))
        .returning({ id: schema.games.id });

      return { deletedCount: deleted.length };
    },
  );
};

export default cronRoutes;
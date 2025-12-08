import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';

const health: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async function (_request, _reply) {
    return { status: 'ok', uptime: process.uptime() };
  });

  // Liveness: process is up
  fastify.get('/live', async function () {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  });

  // Readiness: DB reachable
  fastify.get('/ready', async function () {
    let dbStatus = 'unknown';
    try {
      await fastify.db.execute(sql`select 1`);
      dbStatus = 'connected';
    } catch (_err) {
      dbStatus = 'error';
    }
    return { status: dbStatus === 'connected' ? 'ok' : 'error', db: dbStatus, timestamp: new Date().toISOString() };
  });
};

export default health;

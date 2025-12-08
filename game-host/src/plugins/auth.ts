import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwtStrictEnv } from '../lib/azure-jwt.js';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', async (request) => {
    const authHeader = request.headers['authorization'] as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = undefined;
      return;
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      const { payload } = await verifyJwtStrictEnv(token);

      if (!payload.oid || !payload.email || !payload.idp) {
        request.user = undefined;
        return;
      }

      request.user = { externalId: String(payload.oid), idp: String(payload.idp), email: String(payload.email) };
      return;
    } catch {
      request.user = undefined;
      return;
    }
  });

  fastify.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      reply
        .code(401)
        .send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing or invalid authentication (Bearer token required)',
        });
    }
  });
};

export default fp(authPlugin);

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: {
      externalId: string;
      idp: string;
      email: string;
    };
  }
}

import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', async (request) => {
    const externalId = request.headers['x-ms-client-principal-id'] as string | undefined
    const idp = request.headers['x-ms-client-principal-idp'] as string | undefined
    const email = request.headers['x-ms-client-principal-name'] as string | undefined

    request.user = externalId
      ? {
          externalId,
          idp,
          email,
        }
      : undefined
  })

  fastify.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.externalId) {
      reply.unauthorized('Missing authentication headers from Azure App Service')
    }
  })
}

export default fp(authPlugin)

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user?: {
      externalId: string
      idp?: string
      email?: string
    }
  }
}
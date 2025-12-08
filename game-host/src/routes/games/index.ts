import { FastifyPluginAsync } from 'fastify'
import { GameService, NotFoundError, ForbiddenError, BadRequestError } from '../../modules/games/service.js'

const gamesRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const service = new GameService(fastify.db as any)

  // POST /games - create a new game
  fastify.post('/', {
    preHandler: fastify.requireAuth,
    schema: {
      description: 'Create a new game for the authenticated player',
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            attempts: { type: 'number' },
            startedAt: { type: 'string' },
          },
          required: ['id', 'status', 'attempts', 'startedAt'],
        },
      },
    },
  }, async (request, reply) => {
    try {
      const body = await service.createGameForPlayer(request.user!)
      reply.code(201)
      return body
    } catch (err) {
      fastify.log.error(err)
      return reply.internalServerError('Unexpected error')
    }
  })

  // GET /games/:id - get current game status
  fastify.get('/:id', {
    preHandler: fastify.requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            attempts: { type: 'number' },
            startedAt: { type: 'string' },
            finishedAt: { type: 'string', nullable: true },
            lastGuessAt: { type: 'string', nullable: true },
          },
          required: ['id', 'status', 'attempts', 'startedAt'],
        },
      },
    },
  }, async (request, reply) => {
    const id = String((request.params as any).id)
    try {
      const body = await service.getGameForPlayer(request.user!, id)
      return body
    } catch (err) {
      if (err instanceof NotFoundError) return reply.notFound(err.message)
      if (err instanceof ForbiddenError) return reply.forbidden(err.message)
      fastify.log.error(err)
      return reply.internalServerError('Unexpected error')
    }
  })

  // POST /games/:id/guess - submit a guess
  fastify.post('/:id/guess', {
    preHandler: fastify.requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: { value: { type: 'number', minimum: 1, maximum: 10000 } },
        required: ['value'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: { type: 'string', enum: ['low', 'high', 'correct'] },
            status: { type: 'string' },
            attempts: { type: 'number' },
            lastGuessAt: { type: 'string' },
            finishedAt: { type: 'string', nullable: true },
          },
          required: ['result', 'status', 'attempts', 'lastGuessAt'],
        },
      },
    },
  }, async (request, reply) => {
    const id = String((request.params as any).id)
    const value = Number((request.body as any).value)
    try {
      const body = await service.submitGuess(request.user!, id, value)
      return body
    } catch (err) {
      if (err instanceof NotFoundError) return reply.notFound(err.message)
      if (err instanceof ForbiddenError) return reply.forbidden(err.message)
      if (err instanceof BadRequestError) return reply.badRequest(err.message)
      fastify.log.error(err)
      return reply.internalServerError('Unexpected error')
    }
  })
}

export default gamesRoutes
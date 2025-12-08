import { FastifyPluginAsync } from 'fastify'
import { GameService } from '../../modules/games/service.js'

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
    const body = await service.createGameForPlayer(request.user!)
    reply.code(201)
    return body
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
  }, async (request) => {
    const id = String((request.params as any).id)
    return service.getGameForPlayer(request.user!, id)
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
  }, async (request) => {
    const id = String((request.params as any).id)
    const value = Number((request.body as any).value)
    return service.submitGuess(request.user!, id, value)
  })
}

export default gamesRoutes
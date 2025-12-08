import fp from 'fastify-plugin'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { BadRequestError, ForbiddenError, NotFoundError, ErrorCode } from '../modules/common/errors.js'

function makeErrorPayload(request: FastifyRequest, code: ErrorCode, message: string, details?: unknown) {
  return {
    code,
    message,
    requestId: (request as any).id,
    details: details ?? undefined,
  }
}

export default fp(async (fastify) => {
  fastify.setErrorHandler((err: FastifyError & { validation?: any }, request: FastifyRequest, reply: FastifyReply) => {
    // Validation errors from Fastify/ajv
    if ((err as any).validation) {
      request.log.warn({ err, requestId: (request as any).id }, 'Validation error')
      const payload = makeErrorPayload(request, ErrorCode.VALIDATION, 'Invalid request', (err as any).validation)
      return reply.status(400).send(payload)
    }

    // Domain errors
    if (err instanceof NotFoundError) {
      const payload = makeErrorPayload(request, ErrorCode.NOT_FOUND, err.message)
      return reply.status(404).send(payload)
    }
    if (err instanceof ForbiddenError) {
      const payload = makeErrorPayload(request, ErrorCode.FORBIDDEN, err.message)
      return reply.status(403).send(payload)
    }
    if (err instanceof BadRequestError) {
      const payload = makeErrorPayload(request, ErrorCode.BAD_REQUEST, err.message)
      return reply.status(400).send(payload)
    }

    // Unknown errors
    request.log.error({ err, requestId: (request as any).id }, 'Unhandled error')
    const payload = makeErrorPayload(request, ErrorCode.INTERNAL, 'Internal Server Error')
    return reply.status(500).send(payload)
  })
})
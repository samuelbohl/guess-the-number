import { FastifyPluginAsync } from 'fastify'

const authDebug: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (request) => {
    const keys = [
      'x-ms-client-principal-name',
      'x-ms-client-principal-id',
      'x-ms-client-principal-idp',
      'x-ms-token-aad-id-token',
      'x-ms-token-aad-access-token',
      'x-ms-token-aad-refresh-token',
    ] as const

    const headers: Record<string, string | undefined> = {}
    for (const k of keys) {
      headers[k] = request.headers[k] as string | undefined
    }

    return {
      headers,
      userFromPlugin: request.user ?? null,
    }
  })
}

export default authDebug
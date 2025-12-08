import { FastifyPluginAsync } from 'fastify'
import { verifyJwtSignatureOnly, computeTokenTimings } from '../../lib/azureJwt.js'

const authDebug: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (request) => {
    const keys = [
      'x-ms-client-principal-name',
      'x-ms-client-principal-id',
      'x-ms-client-principal-idp',
      'x-ms-token-aad-id-token',
      'x-ms-token-aad-access-token',
      'x-ms-token-aad-refresh-token',
      'authorization',
    ] as const

    const headers: Record<string, string | undefined> = {}
    for (const k of keys) {
      headers[k] = request.headers[k] as string | undefined
    }

    // Prefer Bearer token from Authorization header, fallback to x-ms-token-aad-id-token
    let token: string | undefined
    const authHeader = headers['authorization']
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length)
    } else {
      token = headers['x-ms-token-aad-id-token']
    }

    const now = new Date()
    const nowEpochSec = Math.floor(now.getTime() / 1000)

    let verification: any = {
      checked: false,
      verified: false,
      reason: undefined as string | undefined,
      timings: undefined as any,
      payload: undefined as any,
      header: undefined as any,
    }

    if (token) {
      try {
        const { payload, header } = await verifyJwtSignatureOnly(token)
        verification = {
          checked: true,
          verified: true,
          timings: computeTokenTimings(nowEpochSec, payload),
          payload,
          header,
        }
      } catch (e) {
        const err = e as Error
        verification = {
          checked: true,
          verified: false,
          reason: err.message,
        }
        // Attempt to decode claims for expiry insight even if signature failed
        try {
          const parts = token.split('.')
          if (parts.length >= 2) {
            const payloadStr = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
            const decoded = JSON.parse(payloadStr)
            verification.timings = computeTokenTimings(nowEpochSec, decoded)
            verification.payload = decoded
          }
        } catch {}
      }
    } else {
      verification = {
        checked: false,
        verified: false,
        reason: 'No bearer token or AAD ID token present',
      }
    }

    return {
      headers,
      verification,
      userFromPlugin: request.user ?? null,
    }
  })
}

export default authDebug
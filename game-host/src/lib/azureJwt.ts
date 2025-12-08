import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTHeaderParameters } from 'jose'

export type VerifyOptions = {
  tenantId: string
  audience: string
}

// Cache JWKS per tenant in memory
const jwksCache: Record<string, ReturnType<typeof createRemoteJWKSet>> = {}

function getJwks(tenantId: string) {
  if (!jwksCache[tenantId]) {
    const jwksUrl = new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
    jwksCache[tenantId] = createRemoteJWKSet(jwksUrl)
  }
  return jwksCache[tenantId]
}

export async function verifyAzureJwt(token: string, opts: VerifyOptions): Promise<{ payload: JWTPayload; header: JWTHeaderParameters; }>{
  const { tenantId, audience } = opts
  const jwks = getJwks(tenantId)

  // Typical issuer for v2 tokens
  const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`

  const { payload, protectedHeader } = await jwtVerify(token, jwks, {
    issuer,
    audience,
  })

  return { payload, header: protectedHeader }
}

export function computeTokenTimings(nowEpochSec: number, payload: JWTPayload) {
  const exp = typeof payload.exp === 'number' ? payload.exp : undefined
  const iat = typeof payload.iat === 'number' ? payload.iat : undefined
  const nbf = typeof payload.nbf === 'number' ? payload.nbf : undefined

  const expired = typeof exp === 'number' ? nowEpochSec >= exp : false
  const notBeforeViolated = typeof nbf === 'number' ? nowEpochSec < nbf : false

  return {
    expired,
    exp,
    iat,
    nbf,
    expISO: typeof exp === 'number' ? new Date(exp * 1000).toISOString() : undefined,
    iatISO: typeof iat === 'number' ? new Date(iat * 1000).toISOString() : undefined,
    nbfISO: typeof nbf === 'number' ? new Date(nbf * 1000).toISOString() : undefined,
    expiresInSeconds: typeof exp === 'number' ? exp - nowEpochSec : undefined,
    notBeforeViolated,
  }
}
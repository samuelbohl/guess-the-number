import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTHeaderParameters } from 'jose'

// Cache JWKS by full URL
const jwksCache: Record<string, ReturnType<typeof createRemoteJWKSet>> = {}

function getJwksFromIssuer(iss: string) {
  const issuerUrl = new URL(iss)
  const base = issuerUrl.origin + issuerUrl.pathname.replace(/\/$/, '')
  const jwksUrl = new URL(base.replace(/\/v2\.0$/, '/discovery/v2.0/keys'))
  const cacheKey = jwksUrl.toString()
  if (!jwksCache[cacheKey]) {
    jwksCache[cacheKey] = createRemoteJWKSet(jwksUrl)
  }
  return jwksCache[cacheKey]
}

// Simplified & secure: strict verification from env issuer/audience
export async function verifyJwtStrictEnv(token: string): Promise<{ payload: JWTPayload; header: JWTHeaderParameters; }>{
  const issuer = process.env.AZURE_ISSUER
  const audience = process.env.AZURE_AUDIENCE
  const expectedTenantId = process.env.AZURE_TENANT_ID
  if (!issuer || !audience) throw new Error('AZURE_ISSUER and AZURE_AUDIENCE must be set')

  const host = new URL(issuer).hostname
  const allowedHost = host.endsWith('ciamlogin.com') || host.endsWith('login.microsoftonline.com')
  if (!allowedHost) throw new Error('Disallowed issuer host')

  const jwks = getJwksFromIssuer(issuer)
  const { payload, protectedHeader } = await jwtVerify(token, jwks, {
    issuer,
    audience,
    // algorithms: ['RS256'], // uncomment to enforce RS256 only
  })

  if (expectedTenantId && payload.tid !== expectedTenantId) {
    throw new Error('Unexpected tenant id')
  }

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
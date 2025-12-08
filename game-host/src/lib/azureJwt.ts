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

// Existing strict verification (issuer + audience)
export async function verifyAzureJwt(token: string, opts: VerifyOptions): Promise<{ payload: JWTPayload; header: JWTHeaderParameters; }>{
  const { tenantId, audience } = opts
  const jwks = getJwks(tenantId)
  const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`
  const { payload, protectedHeader } = await jwtVerify(token, jwks, {
    issuer,
    audience,
  })
  return { payload, header: protectedHeader }
}

// Helper: extract tenantId from the token's iss claim
function extractTenantIdFromIss(iss: string | undefined): string | undefined {
  if (!iss) return undefined
  try {
    const u = new URL(iss)
    // Typical path: /{tenantId}/v2.0
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 1) {
      return parts[0]
    }
  } catch {
    // ignore
  }
  return undefined
}

function decodePayload(token: string): JWTPayload | undefined {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return undefined
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return undefined
  }
}

// New: signature-only verification using remote JWKS derived from the token itself
export async function verifyJwtSignatureOnly(token: string): Promise<{ payload: JWTPayload; header: JWTHeaderParameters; }>{
  const payload = decodePayload(token)
  const tenantId = extractTenantIdFromIss(payload?.iss)
  if (!tenantId) {
    throw new Error('Unable to determine tenant from token issuer')
  }
  const jwks = getJwks(tenantId)
  // Do not pass issuer/audience -> signature-only (with default exp/nbf checks)
  const { payload: verifiedPayload, protectedHeader } = await jwtVerify(token, jwks, {})
  return { payload: verifiedPayload, header: protectedHeader }
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
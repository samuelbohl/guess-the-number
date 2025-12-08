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

// New: derive JWKS URL directly from issuer (supports AAD and CIAM)
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
  const iss = payload?.iss
  if (!iss) {
    throw new Error('Unable to determine issuer from token')
  }
  const jwks = getJwksFromIssuer(iss)
  // Do not pass issuer/audience -> signature-only (with default exp/nbf checks)
  const { payload: verifiedPayload, protectedHeader } = await jwtVerify(token, jwks, {})
  return { payload: verifiedPayload, header: protectedHeader }
}

// Safer: verify with tenant from env and restrict JWKS to CIAM/AAD hosts
export async function verifyJwtSignatureWithTenantEnv(token: string): Promise<{ payload: JWTPayload; header: JWTHeaderParameters; }>{
  const tenantId = process.env.AZURE_TENANT_ID
  if (!tenantId) throw new Error('AZURE_TENANT_ID env var is not set')

  const payload = decodePayload(token)
  if (!payload?.tid) throw new Error('Token missing tenant id (tid) claim')
  if (payload.tid !== tenantId) throw new Error('Unexpected tenant id in token')

  // Prepare JWKS for CIAM and AAD using the tenantId (no reliance on token iss)
  const ciamJwksUrl = new URL(`https://${tenantId}.ciamlogin.com/${tenantId}/discovery/v2.0/keys`)
  const aadJwksUrl = new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)

  const ciamKey = ciamJwksUrl.toString()
  const aadKey = aadJwksUrl.toString()

  if (!jwksCache[ciamKey]) jwksCache[ciamKey] = createRemoteJWKSet(ciamJwksUrl)
  if (!jwksCache[aadKey]) jwksCache[aadKey] = createRemoteJWKSet(aadJwksUrl)

  const ciamJwks = jwksCache[ciamKey]
  const aadJwks = jwksCache[aadKey]

  // Try CIAM then AAD JWKS (signature-only with exp/nbf checks)
  try {
    const { payload: verifiedPayload, protectedHeader } = await jwtVerify(token, ciamJwks, {})
    return { payload: verifiedPayload, header: protectedHeader }
  } catch {
    const { payload: verifiedPayload, protectedHeader } = await jwtVerify(token, aadJwks, {})
    return { payload: verifiedPayload, header: protectedHeader }
  }
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
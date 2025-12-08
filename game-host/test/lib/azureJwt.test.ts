import { test } from 'node:test'
import * as assert from 'node:assert'
import { verifyJwtStrictEnv, computeTokenTimings } from '../../src/lib/azureJwt.js'

async function withEnv(env: Record<string, string | undefined>, fn: () => Promise<void>) {
  const keys = Object.keys(env)
  const original: Record<string, string | undefined> = {}
  for (const k of keys) original[k] = process.env[k]
  try {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'undefined') delete process.env[k]
      else process.env[k] = v
    }
    await fn()
  } finally {
    for (const [k, v] of Object.entries(original)) {
      if (typeof v === 'undefined') delete process.env[k]
      else process.env[k] = v
    }
  }
}

test('verifyJwtStrictEnv throws when AZURE_ISSUER or AZURE_AUDIENCE missing', async () => {
  await withEnv({ AZURE_ISSUER: undefined, AZURE_AUDIENCE: undefined }, async () => {
    await assert.rejects(verifyJwtStrictEnv('dummy'), /AZURE_ISSUER and AZURE_AUDIENCE must be set/)
  })
})

test('verifyJwtStrictEnv throws for disallowed issuer host', async () => {
  await withEnv({ AZURE_ISSUER: 'https://evil.com/tenant/v2.0', AZURE_AUDIENCE: 'client-id' }, async () => {
    await assert.rejects(verifyJwtStrictEnv('dummy'), /Disallowed issuer host/)
  })
})

test('computeTokenTimings computes expiry and not-before flags', () => {
  const now = Math.floor(Date.now() / 1000)
  const payload = { exp: now + 60, iat: now - 10, nbf: now + 5 }
  const t = computeTokenTimings(now, payload)
  assert.equal(t.expired, false)
  assert.equal(t.notBeforeViolated, true)
  assert.equal(t.expiresInSeconds, 60)
  assert.ok(typeof t.expISO === 'string')
  assert.ok(typeof t.iatISO === 'string')
  assert.ok(typeof t.nbfISO === 'string')
})
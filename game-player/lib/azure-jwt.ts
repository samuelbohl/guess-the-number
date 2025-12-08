import { createRemoteJWKSet, jwtVerify } from 'jose';

export type VerifyOptions = {
  tenantId: string; // e.g. 'YOUR_TENANT_ID_GUID'
  audience: string; // application (client) ID your app expects
};

// Cache JWKS per tenant in memory; Next middleware/app server persists during runtime
const jwksCache: Record<string, ReturnType<typeof createRemoteJWKSet>> = {};

function getJwks(tenantId: string) {
  if (!jwksCache[tenantId]) {
    const jwksUrl = new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
    jwksCache[tenantId] = createRemoteJWKSet(jwksUrl);
  }
  return jwksCache[tenantId];
}

export async function verifyAzureJwt(token: string, opts: VerifyOptions) {
  const { tenantId, audience } = opts;
  const jwks = getJwks(tenantId);

  // Typical issuer for v2 tokens
  const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

  const { payload, protectedHeader } = await jwtVerify(token, jwks, {
    issuer,
    audience,
  });

  return {
    payload, // return as-is to avoid relying on external types
    header: protectedHeader,
  };
}

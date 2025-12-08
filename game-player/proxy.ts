import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAzureJwt } from './lib/azureJwt';

function base64UrlToBase64(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  return normalized + (pad ? '='.repeat(4 - pad) : '');
}

function getPayloadFromJwt(token?: string): any | undefined {
  if (!token) return undefined;
  const parts = token.split('.');
  if (parts.length < 2) return undefined;
  try {
    const payloadBase64 = base64UrlToBase64(parts[1]);
    const payloadStr = atob(payloadBase64);
    return JSON.parse(payloadStr);
  } catch {
    return undefined;
  }
}

function getExpFromJwt(token?: string): number | undefined {
  const payload = getPayloadFromJwt(token);
  return typeof payload?.exp === 'number' ? payload.exp : undefined;
}

function logSimple(path: string, validated: boolean) {
  const enabled = process.env.LOG_PROXY !== 'false';
  if (!enabled) return;
  // eslint-disable-next-line no-console
  console.log(`${path} ${validated ? 'validated' : 'skipped'}`);
}

export async function proxy(req: NextRequest) {
  const nowEpoch = Math.floor(Date.now() / 1000);
  const url = req.nextUrl.clone();
  const path = `${url.pathname}${url.search}`;

  const idToken = req.headers.get('x-ms-token-aad-id-token') || undefined;
  const payload = getPayloadFromJwt(idToken);
  const exp = typeof payload?.exp === 'number' ? payload.exp : undefined;
  const tid = payload?.tid;
  const aud = payload?.aud;

  const envTenantId = process.env.AAD_TENANT_ID;
  const envClientId = process.env.AAD_CLIENT_ID;
  const tenantId = envTenantId || tid; // prefer env, fallback to tid claim

  const principal = req.headers.get('x-ms-client-principal');
  const isAuthenticated = Boolean(principal);

  const expired = exp !== undefined && nowEpoch >= exp;
  const shouldValidate = Boolean(idToken) && Boolean(tenantId) && !expired;

  // Single simple log per request
  logSimple(path, shouldValidate);

  // If we have an Easy Auth session but the token is expired, proactively refresh tokens.
  if (isAuthenticated && expired) {
    try {
      const cookieHeader = req.headers.get('cookie') ?? '';
      await fetch(`${url.origin}/.auth/refresh`, {
        headers: { Cookie: cookieHeader },
      });
    } catch {
      // ignore refresh failures; request will still proceed and middleware will handle login if session missing
    }
  }

  // Redirect only when not authenticated (no Easy Auth session)
  if (!isAuthenticated) {
    const returnUrl = `${url.origin}${path}`;
    const loginUrl = `${url.origin}/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnUrl)}`;
    return NextResponse.redirect(loginUrl);
  }

  // Signature and claims verification when applicable
  if (shouldValidate && idToken && tenantId) {
    try {
      await verifyAzureJwt(idToken, {
        tenantId,
        audience: envClientId ?? aud ?? '',
      });
    } catch (e) {
      const returnUrl = `${url.origin}${path}`;
      const loginUrl = `${url.origin}/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnUrl)}`;
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Exclude static assets and Azure EasyAuth endpoints to avoid redirect loops
export const config = {
  matcher: ['/((?!_next|favicon.ico|public|.auth).*)'],
};
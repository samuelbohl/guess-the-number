import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function base64UrlToBase64(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  return normalized + (pad ? '='.repeat(4 - pad) : '');
}

function getExpFromJwt(token?: string): number | undefined {
  if (!token) return undefined;
  const parts = token.split('.');
  if (parts.length < 2) return undefined;
  try {
    const payloadBase64 = base64UrlToBase64(parts[1]);
    // atob is available in the edge runtime
    const payloadStr = atob(payloadBase64);
    const payload = JSON.parse(payloadStr);
    return typeof payload.exp === 'number' ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

export function middleware(req: NextRequest) {
  const now = Math.floor(Date.now() / 1000);
  const idToken = req.headers.get('x-ms-token-aad-id-token') || undefined;
  const exp = getExpFromJwt(idToken);

  
  if (exp !== undefined && now >= exp) {
    const url = req.nextUrl.clone();
    const returnUrl = `${url.origin}${url.pathname}${url.search}`;
    const loginUrl = `${url.origin}/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnUrl)}`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Exclude static assets and Azure EasyAuth endpoints to avoid redirect loops
export const config = {
  matcher: ['/((?!_next|favicon.ico|public|.auth).*)'],
};
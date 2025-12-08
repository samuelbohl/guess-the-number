import { headers } from 'next/headers';
export const dynamic = 'force-dynamic';
import TokenActions from './TokenActions';

export default async function AuthDebugPage() {
  // 1. Get the headers object
  const headerList = await headers();

  // Add server-side timestamp
  const now = new Date();
  const nowIso = now.toISOString();
  const nowEpochSec = Math.floor(now.getTime() / 1000);

  // Helper to decode base64url (JWT parts)
  const base64UrlDecode = (str: string) => {
    const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLen);
    return Buffer.from(padded, 'base64').toString('utf-8');
  };

  // Attempt to decode AAD ID token and compute expiry
  const idToken = headerList.get('x-ms-token-aad-id-token');
  let decodedIdToken: any = null;
  let tokenStatus: {
    expired: boolean;
    exp?: number;
    expISO?: string;
    iat?: number;
    iatISO?: string;
    nbf?: number;
    nbfISO?: string;
    expiresInSeconds?: number;
  } | null = null;

  if (idToken) {
    try {
      const parts = idToken.split('.');
      if (parts.length >= 2) {
        const payloadStr = base64UrlDecode(parts[1]);
        decodedIdToken = JSON.parse(payloadStr);

        const exp = decodedIdToken?.exp as number | undefined;
        const iat = decodedIdToken?.iat as number | undefined;
        const nbf = decodedIdToken?.nbf as number | undefined;

        const expired = typeof exp === 'number' ? nowEpochSec >= exp : false;
        const expISO = typeof exp === 'number' ? new Date(exp * 1000).toISOString() : undefined;
        const iatISO = typeof iat === 'number' ? new Date(iat * 1000).toISOString() : undefined;
        const nbfISO = typeof nbf === 'number' ? new Date(nbf * 1000).toISOString() : undefined;
        const expiresInSeconds = typeof exp === 'number' ? exp - nowEpochSec : undefined;

        tokenStatus = {
          expired,
          exp,
          expISO,
          iat,
          iatISO,
          nbf,
          nbfISO,
          expiresInSeconds,
        };
      }
    } catch (e) {
      // Decoding failed
      decodedIdToken = { error: 'Failed to decode AAD ID token', message: (e as Error).message };
    }
  }

  // 2. Define the keys we want to look for
  const authHeaders = [
    'x-ms-client-principal-name', // User email/ID
    'x-ms-client-principal-id', // Unique User ID
    'x-ms-client-principal-idp', // Identity Provider (e.g., aad, google)
    'x-ms-token-aad-id-token', // JWT Token (Entra ID)
    'x-ms-token-aad-access-token',
    'x-ms-token-aad-refresh-token',
  ];

  // 3. Extract simple header values
  const headerValues = authHeaders.map((key) => ({
    key,
    value: headerList.get(key) || 'Not present',
  }));

  // 4. Decode the detailed Principal Object (Base64)
  // This contains the "claims" (roles, groups, detailed names)
  const principalEncoded = headerList.get('x-ms-client-principal');
  let principalDecoded = null;

  if (principalEncoded) {
    try {
      const buffer = Buffer.from(principalEncoded, 'base64');
      principalDecoded = JSON.parse(buffer.toString('utf-8'));
    } catch (e) {
      console.error('Failed to decode principal', e);
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Azure Auth Debugger</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>0. Server Time & Token Status</h2>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Server time:</strong> {nowIso}
        </div>
        <div style={{ background: '#fffaf0', padding: '0.75rem', border: '1px solid #f0e6d2', borderRadius: '6px' }}>
          {idToken ? (
            tokenStatus ? (
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>
                  <strong>Expired:</strong> {String(tokenStatus.expired)}
                </li>
                {tokenStatus.expISO && (
                  <li>
                    <strong>exp:</strong> {tokenStatus.exp} ({tokenStatus.expISO})
                  </li>
                )}
                {tokenStatus.iatISO && (
                  <li>
                    <strong>iat:</strong> {tokenStatus.iat} ({tokenStatus.iatISO})
                  </li>
                )}
                {tokenStatus.nbfISO && (
                  <li>
                    <strong>nbf:</strong> {tokenStatus.nbf} ({tokenStatus.nbfISO})
                  </li>
                )}
                {typeof tokenStatus.expiresInSeconds === 'number' && (
                  <li>
                    <strong>expiresInSeconds:</strong> {tokenStatus.expiresInSeconds}
                  </li>
                )}
              </ul>
            ) : (
              <p>Token present but could not determine expiry.</p>
            )
          ) : (
            <p>No AAD ID token present in headers (x-ms-token-aad-id-token).</p>
          )}
          <TokenActions returnPath={'/auth-debug'} />
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Raw Headers</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
          <thead>
            <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Header Key</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {headerValues.map((item) => (
              <tr key={item.key}>
                <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>{item.key}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc', wordBreak: 'break-all' }}>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Decoded Client Principal (Claims)</h2>
        <div
          style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}
        >
          {principalDecoded ? (
            <pre>{JSON.stringify(principalDecoded, null, 2)}</pre>
          ) : (
            <p>
              No Client Principal found. <br />
              <small>
                (If you are running on Localhost, this is expected. These headers are only injected in Azure.)
              </small>
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Decoded AAD ID Token</h2>
        <div
          style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}
        >
          {decodedIdToken ? (
            <pre>{JSON.stringify(decodedIdToken, null, 2)}</pre>
          ) : (
            <p>No AAD ID token found or failed to decode.</p>
          )}
        </div>
      </section>
    </div>
  );
}

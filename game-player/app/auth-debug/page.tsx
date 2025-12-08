import { headers } from 'next/headers';

export default async function AuthDebugPage() {
  // 1. Get the headers object
  const headerList = await headers();

  // 2. Define the keys we want to look for
  const authHeaders = [
    'x-ms-client-principal-name', // User email/ID
    'x-ms-client-principal-id',   // Unique User ID
    'x-ms-client-principal-idp',  // Identity Provider (e.g., aad, google)
    'x-ms-token-aad-id-token',    // JWT Token (Entra ID)
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
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Azure Auth Debugger
      </h1>

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
                <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>
                  {item.key}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc', wordBreak: 'break-all' }}>
                  {item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Decoded Client Principal (Claims)</h2>
        <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
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
    </div>
  );
}
'use client';

import { useState } from 'react';

export default function TokenActions({ returnPath }: { returnPath: string }) {
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      await fetch('/.auth/refresh', { credentials: 'include' });
      location.reload();
    } finally {
      setLoading(false);
    }
  };

  const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnPath)}`;

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
      <button
        onClick={refresh}
        disabled={loading}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          border: '1px solid #ccc',
          background: loading ? '#eee' : '#f7f7f7',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Refreshing…' : 'Refresh tokens'}
      </button>
      <a href={loginUrl} style={{ color: '#0366d6', textDecoration: 'none' }}>
        Re-authenticate
      </a>
    </div>
  );
}

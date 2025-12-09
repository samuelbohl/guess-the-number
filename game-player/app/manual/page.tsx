import GuessTheNumberGame from '@/components/guess-the-number-game';
import { redirect } from 'next/navigation';
import { isActiveToken } from '@/lib/utils';
import { headers } from 'next/headers';

export default async function Home() {
  const headerList = await headers();
  const token = headerList.get('x-ms-token-aad-id-token');
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  if (!isActiveToken(token)) {
    const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(`/manual`)}`;
    redirect(loginUrl);
  }

  return (
    <main className="min-h-screen bg-background">
      <GuessTheNumberGame />
    </main>
  );
}

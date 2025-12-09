import BotGameServer from '@/components/bot/bot-game-server';
import { redirect } from 'next/navigation';
import { isActiveToken } from '@/lib/utils';
import { headers } from 'next/headers';

export default async function BotPage() {
  const headerList = await headers();
  const token = headerList.get('x-ms-token-aad-id-token');
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  if (!isActiveToken(token)) {
    const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(`/bot`)}`;
    redirect(loginUrl);
  }

  return (
    <main className="min-h-screen bg-background">
      <BotGameServer />
    </main>
  );
}

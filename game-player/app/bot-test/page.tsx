import { headers } from 'next/headers';
import { GameHostClient } from '@/lib/clients/game-host-client';
import { GuessBot, Strategies } from '@/lib/bot';
import { redirect } from 'next/navigation';
import { isActiveToken } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function BotTestPage() {
  const h = await headers();
  const token = h.get('x-ms-token-aad-id-token');
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  if (!isActiveToken(token)) {
    const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(`/bot-test`)}`;
    redirect(loginUrl);
  }

  const client = new GameHostClient(token);
  const strategy = Strategies.binary();
  const created = await client.createGame();
  const bot = new GuessBot(client, strategy, { initialRange: { min: 1, max: 10000 }, maxAttempts: 256 });
  const result = await bot.play(created.id);

  const finalRange = bot.getRange();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Bot Test</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Running fixed strategy: <code>binary</code>
        </p>

        <div className="space-y-2 mb-6">
          <div>
            Strategy: <span className="font-mono">{strategy.name}</span>
          </div>
          <div>
            Game ID: <span className="font-mono">{created.id}</span>
          </div>
          <div>
            Status: <span className="font-mono">{result.status}</span>
          </div>
          <div>
            Attempts: <span className="font-mono">{result.attempts}</span>
          </div>
          <div>
            Default Range: <span className="font-mono">1 - 10000</span>
          </div>
          <div>
            Final Range:{' '}
            <span className="font-mono">
              {finalRange.min} - {finalRange.max}
            </span>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">History</h2>
        <ul className="list-disc pl-6 mb-8">
          {result.history.map((rec, i) => (
            <li key={i} className="font-mono">
              #{i + 1}: guess {rec.guess} → {rec.result}
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold mb-2">Raw Result</h2>
        <pre className="bg-muted text-foreground p-4 rounded-md overflow-x-auto">
          {JSON.stringify(
            {
              strategy: strategy.name,
              gameId: created.id,
              result,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </main>
  );
}

import { headers } from 'next/headers';
import BotGameServer from '@/components/bot/bot-game-server';
import { getDb } from '@/lib/db/client';
import { playerGames, playerGuesses } from '@/lib/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import type { BotAlgorithmKey } from '@/lib/actions/bot';
import { redirect } from 'next/navigation';
import { isActiveToken } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function BotGamePage({ params }: { params: { id: string } }) {
  const headerList = await headers();
  const token = headerList.get('x-ms-token-aad-id-token');
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  if (!isActiveToken(token)) {
    const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(`/bot/${params.id}`)}`;
    redirect(loginUrl);
  }

  const principalId = headerList.get('x-ms-client-principal-id');
  if (!principalId) {
    throw new Error("Missing principal ID in 'x-ms-client-principal-id' header.");
  }

  const { id } = await params;
  const db = getDb();
  const gameRow = await db
    .select({
      id: playerGames.id,
      attempts: playerGames.attempts,
      rangeMin: playerGames.rangeMin,
      rangeMax: playerGames.rangeMax,
      status: playerGames.status,
      algorithm: playerGames.algorithm,
    })
    .from(playerGames)
    .where(and(eq(playerGames.hostGameId, id), eq(playerGames.playerId, principalId)))
    .limit(1);

  if (gameRow.length === 0) {
    throw new Error('Game not found.');
  }

  const playerGame = gameRow[0] ?? null;
  const initialAttempts = playerGame.attempts;
  const initialRange = { min: playerGame.rangeMin, max: playerGame.rangeMax };
  const initialStatus = playerGame.status as 'active' | 'completed';
  const initialAlgorithm = (playerGame.algorithm ?? undefined) as BotAlgorithmKey | undefined;

  const guesses = await db
    .select({ value: playerGuesses.value, feedback: playerGuesses.feedback })
    .from(playerGuesses)
    .where(eq(playerGuesses.gameId, playerGame.id))
    .orderBy(asc(playerGuesses.id));

  const initialHistory = guesses.map((g) => ({ guess: g.value, feedback: g.feedback }));

  return (
    <main className="min-h-screen bg-background">
      <BotGameServer
        initialGameId={id}
        initialAttempts={initialAttempts}
        initialRange={initialRange}
        initialHistory={initialHistory}
        initialStatus={initialStatus}
        initialAlgorithm={initialAlgorithm}
      />
    </main>
  );
}

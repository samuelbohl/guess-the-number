import Link from 'next/link';
import { headers } from 'next/headers';
import { and, desc, eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDb } from '@/lib/db/client';
import { playerGames } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function GamesPage() {
  const headerList = await headers();
  const principalId = headerList.get('x-ms-client-principal-id');

  if (!principalId) {
    throw new Error("Missing principal ID in 'x-ms-client-principal-id' header.");
  }

  const db = getDb();
  const games = await db
    .select()
    .from(playerGames)
    .where(eq(playerGames.playerId, principalId))
    .orderBy(desc(playerGames.startedAt));

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="mx-auto max-w-5xl">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">Saved Games</CardTitle>
              <CardDescription className="text-base">A list of your games across manual and bot modes</CardDescription>
            </CardHeader>
            <CardContent>
              {games.length === 0 ? (
                <div className="text-muted-foreground py-8">No saved games found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="p-3 text-left">Host Game ID</th>
                        <th className="p-3 text-left">Mode</th>
                        <th className="p-3 text-left">Algorithm</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Attempts</th>
                        <th className="p-3 text-left">Range</th>
                        <th className="p-3 text-left">Started</th>
                        <th className="p-3 text-left">Last Guess</th>
                        <th className="p-3 text-left">Finished</th>
                        <th className="p-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((g) => (
                        <tr key={g.id} className="border-t">
                          <td className="p-3 font-mono text-xs md:text-sm">{g.hostGameId}</td>
                          <td className="p-3">
                            <Badge variant={g.mode === 'manual' ? 'default' : 'secondary'}>{g.mode}</Badge>
                          </td>
                          <td className="p-3">{g.algorithm ?? '-'}</td>
                          <td className="p-3">
                            <Badge variant={g.status === 'completed' ? 'secondary' : 'default'}>{g.status}</Badge>
                          </td>
                          <td className="p-3">{g.attempts}</td>
                          <td className="p-3">
                            {g.rangeMin} – {g.rangeMax}
                          </td>
                          <td className="p-3">{formatDate(g.startedAt)}</td>
                          <td className="p-3">{formatDate(g.lastGuessAt)}</td>
                          <td className="p-3">{formatDate(g.finishedAt)}</td>
                          <td className="p-3">
                            {g.mode === 'manual' ? (
                              <Link href={`/manual/${g.hostGameId}`}>
                                <Button size="sm">Open</Button>
                              </Link>
                            ) : (
                              <Link href={`/bot/${g.hostGameId}`}>
                                <Button size="sm" variant="secondary">
                                  Open
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

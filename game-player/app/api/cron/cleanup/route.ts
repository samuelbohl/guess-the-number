import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { playerGames } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  try {
    const deleted = await db
      .delete(playerGames)
      .where(eq(playerGames.status, 'completed'))
      .returning({ id: playerGames.id });

    return NextResponse.json({ deletedCount: deleted.length });
  } catch (err) {
    console.error('Failed to cleanup completed player games:', err);
    return NextResponse.json({ error: 'Failed to cleanup completed player games' }, { status: 500 });
  }
}
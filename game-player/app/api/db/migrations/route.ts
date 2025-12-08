import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  try {
    const res = await db.execute(sql`
      SELECT *
      FROM "drizzle"."__drizzle_migrations"
      ORDER BY 1
    `);

    return NextResponse.json((res as any).rows ?? []);
  } catch (err) {
    console.error('Failed to fetch migrations:', err);
    return NextResponse.json({ error: 'Failed to fetch migrations' }, { status: 500 });
  }
}

import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema.js';

export class PlayersRepository {
  constructor(private db: NodePgDatabase<typeof schema>) {}

  async findByExternalId(externalId: string) {
    const rows = await this.db.select().from(schema.players).where(eq(schema.players.externalId, externalId)).limit(1);

    return rows[0] ?? null;
  }

  async create({ externalId, idp, email }: { externalId: string; idp?: string; email?: string }) {
    const [inserted] = await this.db.insert(schema.players).values({ externalId, idp, email }).returning();

    return inserted;
  }
}

export class GamesRepository {
  constructor(private db: NodePgDatabase<typeof schema>) {}

  async create({ playerId, targetNumber }: { playerId: number; targetNumber: number }) {
    const [game] = await this.db.insert(schema.games).values({ playerId, targetNumber, status: 'active' }).returning();

    return game;
  }

  async findById(id: string) {
    const rows = await this.db.select().from(schema.games).where(eq(schema.games.id, id)).limit(1);

    return rows[0] ?? null;
  }

  async update(
    id: string,
    updates: Partial<{ status: 'active' | 'completed'; attempts: number; finishedAt: Date; lastGuessAt: Date }>,
  ) {
    const [updated] = await this.db.update(schema.games).set(updates).where(eq(schema.games.id, id)).returning();

    return updated;
  }
}

export class GuessesRepository {
  constructor(private db: NodePgDatabase<typeof schema>) {}

  async create({
    gameId,
    playerId,
    value,
    result,
  }: {
    gameId: string;
    playerId: number;
    value: number;
    result: 'low' | 'high' | 'correct';
  }) {
    await this.db.insert(schema.guesses).values({ gameId, playerId, value, result });
  }
}

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema.js';
import { PlayersRepository, GamesRepository, GuessesRepository } from './repositories.js';

import { NotFoundError, ForbiddenError, BadRequestError } from '../common/errors.js';

export type AuthUser = {
  externalId: string;
  idp: string;
  email: string;
};

export class GameService {
  private players: PlayersRepository;
  private games: GamesRepository;
  private guesses: GuessesRepository;

  // @ts-ignore
  constructor(private db: NodePgDatabase<typeof schema>) {
    this.players = new PlayersRepository(db);
    this.games = new GamesRepository(db);
    this.guesses = new GuessesRepository(db);
  }

  private randomTarget() {
    return Math.floor(Math.random() * 10000) + 1;
  }

  async ensurePlayer(user: AuthUser) {
    const existing = await this.players.findByExternalId(user.externalId);
    if (existing) return existing;
    return this.players.create({ externalId: user.externalId, idp: user.idp, email: user.email });
  }

  async createGameForPlayer(user: AuthUser) {
    const player = await this.ensurePlayer(user);
    const target = this.randomTarget();
    const game = await this.games.create({ playerId: player.id, targetNumber: target });

    return {
      id: game.id,
      status: game.status,
      attempts: game.attempts,
      startedAt: game.startedAt?.toISOString?.() ?? String(game.startedAt),
    };
  }

  async getGameForPlayer(user: AuthUser, id: string) {
    const player = await this.ensurePlayer(user);
    const game = await this.games.findById(id);
    if (!game) throw new NotFoundError('Game not found');
    if (game.playerId !== player.id) throw new ForbiddenError('Not your game');

    return {
      id: game.id,
      status: game.status,
      attempts: game.attempts,
      startedAt: game.startedAt?.toISOString?.() ?? String(game.startedAt),
      finishedAt: game.finishedAt ? (game.finishedAt as Date).toISOString() : null,
      lastGuessAt: game.lastGuessAt ? (game.lastGuessAt as Date).toISOString() : null,
    };
  }

  async submitGuess(user: AuthUser, id: string, value: number) {
    const player = await this.ensurePlayer(user);
    const game = await this.games.findById(id);
    if (!game) throw new NotFoundError('Game not found');
    if (game.playerId !== player.id) throw new ForbiddenError('Not your game');
    if (game.status === 'completed') throw new BadRequestError('Game already completed');

    let result: 'low' | 'high' | 'correct';
    if (value < game.targetNumber) result = 'low';
    else if (value > game.targetNumber) result = 'high';
    else result = 'correct';

    await this.guesses.create({ gameId: game.id, playerId: player.id, value, result });

    const now = new Date();
    const updates: any = {
      attempts: (game.attempts ?? 0) + 1,
      lastGuessAt: now,
    };

    if (result === 'correct') {
      updates.status = 'completed';
      updates.finishedAt = now;
    }

    const updated = await this.games.update(game.id, updates);

    return {
      result,
      status: updated.status,
      attempts: updated.attempts,
      lastGuessAt: updated.lastGuessAt ? (updated.lastGuessAt as Date).toISOString() : now.toISOString(),
      finishedAt: updated.finishedAt ? (updated.finishedAt as Date).toISOString() : null,
    };
  }
}

import { pgTable, serial, text, timestamp, uuid, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const playerGameModeEnum = pgEnum('player_game_mode', ['manual', 'bot']);
export const playerGameStatusEnum = pgEnum('player_game_status', ['active', 'completed']);
export const playerGuessFeedbackEnum = pgEnum('player_guess_feedback', ['low', 'high', 'correct']);

export const playerGames = pgTable('player_games', {
  id: uuid('id').defaultRandom().primaryKey(),
  playerId: text('player_id').notNull(),
  mode: playerGameModeEnum('mode').notNull(),
  hostGameId: uuid('host_game_id').notNull(),
  algorithm: text('algorithm'),
  status: playerGameStatusEnum('status').default('active').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  rangeMin: integer('range_min').default(1).notNull(),
  rangeMax: integer('range_max').default(10000).notNull(),
  startedAt: timestamp('started_at', { mode: 'date' }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { mode: 'date' }),
  lastGuessAt: timestamp('last_guess_at', { mode: 'date' }),
});

export const playerGuesses = pgTable('player_guesses', {
  id: serial('id').primaryKey(),
  gameId: uuid('game_id')
    .notNull()
    .references(() => playerGames.id, {
      onDelete: 'cascade',
      onUpdate: 'no action',
    }),
  value: integer('value').notNull(),
  feedback: playerGuessFeedbackEnum('feedback').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const playerGamesRelations = relations(playerGames, (r: any) => ({
  guesses: r.many(playerGuesses),
}));

export const playerGuessesRelations = relations(playerGuesses, (r: any) => ({
  game: r.one(playerGames, { fields: [playerGuesses.gameId], references: [playerGames.id] }),
}));

export type PlayerGame = InferSelectModel<typeof playerGames>;
export type NewPlayerGame = InferInsertModel<typeof playerGames>;

export type PlayerGuess = InferSelectModel<typeof playerGuesses>;
export type NewPlayerGuess = InferInsertModel<typeof playerGuesses>;

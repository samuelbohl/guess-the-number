import { pgTable, serial, text, timestamp, uuid, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const gameStatusEnum = pgEnum('game_status', ['active', 'completed']);
export const guessResultEnum = pgEnum('guess_result', ['low', 'high', 'correct']);

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(), // x-ms-client-principal-id
  idp: text('idp'), // x-ms-client-principal-idp
  email: text('email'), // x-ms-client-principal-name (email)
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const games = pgTable('games', {
  id: uuid('id').defaultRandom().primaryKey(),
  playerId: integer('player_id')
    .notNull()
    .references(() => players.id, {
      onDelete: 'cascade',
      onUpdate: 'no action',
    }),
  targetNumber: integer('target_number').notNull(), // 1..10000
  status: gameStatusEnum('status').default('active').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  startedAt: timestamp('started_at', { mode: 'date' }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { mode: 'date' }),
  lastGuessAt: timestamp('last_guess_at', { mode: 'date' }),
});

export const guesses = pgTable('guesses', {
  id: serial('id').primaryKey(),
  gameId: uuid('game_id')
    .notNull()
    .references(() => games.id, {
      onDelete: 'cascade',
      onUpdate: 'no action',
    }),
  playerId: integer('player_id')
    .notNull()
    .references(() => players.id, {
      onDelete: 'cascade',
      onUpdate: 'no action',
    }),
  value: integer('value').notNull(),
  result: guessResultEnum('result').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const playersRelations = relations(players, ({ many }) => ({
  games: many(games),
  guesses: many(guesses),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  player: one(players, { fields: [games.playerId], references: [players.id] }),
  guesses: many(guesses),
}));

export const guessesRelations = relations(guesses, ({ one }) => ({
  game: one(games, { fields: [guesses.gameId], references: [games.id] }),
  player: one(players, { fields: [guesses.playerId], references: [players.id] }),
}));

export type Player = InferSelectModel<typeof players>;
export type NewPlayer = InferInsertModel<typeof players>;

export type Game = InferSelectModel<typeof games>;
export type NewGame = InferInsertModel<typeof games>;

export type Guess = InferSelectModel<typeof guesses>;
export type NewGuess = InferInsertModel<typeof guesses>;

"use server";

import { headers } from "next/headers";
import { GameHostClient } from "@/lib/clients/game-host-client";
import { getDb } from "@/lib/db/client";
import { playerGames, playerGuesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Strategies, GuessBot } from "@/lib/bot";
import type { GuessRecord } from "@/lib/bot/GuessStrategy";
import { AuthenticationError, DatabaseError, logError } from "@/lib/errors";

export type BotAlgorithmKey = keyof typeof Strategies;

export type BotPlayResponse = {
  hostGameId: string;
  attempts: number;
  status: "completed" | "aborted";
  history: { guess: number; result: "low" | "high" | "correct" }[];
};

export async function startAndPlayBotGameAction(
  algorithm: BotAlgorithmKey
): Promise<BotPlayResponse> {
  const headerList = await headers();
  const token = headerList.get("x-ms-token-aad-id-token");
  if (!token) {
    const error = new AuthenticationError("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
    logError(error, { action: 'startAndPlayBotGameAction', algorithm, reason: 'missing_token' });
    throw error;
  }

  const principalId = headerList.get("x-ms-client-principal-id");
  if (!principalId) {
    const error = new AuthenticationError("Missing principal ID in 'x-ms-client-principal-id' header.");
    logError(error, { action: 'startAndPlayBotGameAction', algorithm, reason: 'missing_principal' });
    throw error;
  }

  const client = new GameHostClient(token);
  const created = await client.createGame();

  const db = getDb();
  const inserted = await db
    .insert(playerGames)
    .values({
      playerId: principalId,
      mode: "bot",
      hostGameId: created.id,
      algorithm,
      status: "active",
      attempts: created.attempts ?? 0,
      rangeMin: 1,
      rangeMax: 10000,
      startedAt: new Date(created.startedAt),
    })
    .returning({ id: playerGames.id });

  const playerGameId = inserted[0]?.id;
  if (!playerGameId) {
    const error = new DatabaseError('Failed to create player game record');
    logError(error, { action: 'startAndPlayBotGameAction', algorithm, reason: 'create_game_failed' });
    throw error;
  }

  let rangeMin = 1;
  let rangeMax = 10000;
  const bot = new GuessBot(client, Strategies[algorithm]());
  const playResult = await bot.play(created.id);

  for (const rec of playResult.history) {
    const guessResult = await db.insert(playerGuesses).values({
      gameId: playerGameId,
      value: rec.guess,
      feedback: rec.result,
    });
    
    if (!guessResult) {
      const error = new DatabaseError('Failed to save bot guess');
      logError(error, { action: 'startAndPlayBotGameAction', algorithm, gameId: created.id, guess: rec.guess, reason: 'save_guess_failed' });
      throw error;
    }

    if (rec.result === "low") {
      rangeMin = Math.max(rangeMin, rec.guess + 1);
    } else if (rec.result === "high") {
      rangeMax = Math.min(rangeMax, rec.guess - 1);
    } else if (rec.result === "correct") {
      rangeMin = rec.guess;
      rangeMax = rec.guess;
    }
  }

  const hostGame = await client.getGame(created.id);
  const updateResult = await db
    .update(playerGames)
    .set({
      attempts: hostGame.attempts ?? playResult.attempts,
      status: hostGame.status === "completed" ? "completed" : "active",
      lastGuessAt: hostGame.lastGuessAt ? new Date(hostGame.lastGuessAt) : new Date(),
      finishedAt: hostGame.finishedAt ? new Date(hostGame.finishedAt) : undefined,
      rangeMin,
      rangeMax,
    })
    .where(eq(playerGames.id, playerGameId));
    
  if (!updateResult) {
    const error = new DatabaseError('Failed to update game state');
    logError(error, { action: 'startAndPlayBotGameAction', algorithm, gameId: created.id, reason: 'update_game_failed' });
    throw error;
  }

  return {
    hostGameId: created.id,
    attempts: playResult.attempts,
    status: playResult.status,
    history: playResult.history.map((h: GuessRecord) => ({ guess: h.guess, result: h.result })),
  };
}
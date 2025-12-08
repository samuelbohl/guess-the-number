"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GameHostClient } from "@/lib/clients/game-host-client";
import type { GameHostSubmitGuessResponse } from "@/lib/types/game-host";
import { getDb } from "@/lib/db/client";
import { playerGames, playerGuesses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { AuthenticationError, DatabaseError, logError, AppError } from "@/lib/errors";

export async function startNewGameAction() {
  const headerList = await headers();
  const token = headerList.get("x-ms-token-aad-id-token");
  if (!token) {
    const error = new AuthenticationError("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
    logError(error, { action: 'startNewGameAction', reason: 'missing_token' });
    throw error;
  }

  const principalId = headerList.get("x-ms-client-principal-id") || "unknown";
  if (!principalId) {
    const error = new AuthenticationError("Missing principal ID in 'x-ms-client-principal-id' header.");
    logError(error, { action: 'startNewGameAction', reason: 'missing_principal' });
    throw error;
  }

  const client = new GameHostClient(token);
  const created = await client.createGame();

  const db = getDb();
  const insertResult = await db.insert(playerGames).values({
    playerId: principalId,
    mode: "manual",
    hostGameId: created.id,
    algorithm: null,
    status: "active",
    attempts: created.attempts ?? 0,
    rangeMin: 1,
    rangeMax: 10000,
    startedAt: new Date(created.startedAt),
  });

  if (!insertResult) {
    const error = new DatabaseError('Failed to create game record');
    logError(error, { action: 'startNewGameAction', gameId: created.id, principalId });
    throw error;
  }

  redirect(`/manual/${created.id}`);
}

export async function submitGuessAction(
  gameId: string,
  value: number
): Promise<GameHostSubmitGuessResponse> {
  const headerList = await headers();
  const token = headerList.get("x-ms-token-aad-id-token");
  if (!token) {
    const error = new AuthenticationError("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
    logError(error, { action: 'submitGuessAction', gameId, reason: 'missing_token' });
    throw error;
  }

  const principalId = headerList.get("x-ms-client-principal-id") || "unknown";
  if (!principalId) {
    const error = new AuthenticationError("Missing principal ID in 'x-ms-client-principal-id' header.");
    logError(error, { action: 'submitGuessAction', gameId, reason: 'missing_principal' });
    throw error;
  }

  const client = new GameHostClient(token);
  const res = await client.makeGuess(gameId, value);
  
  const db = getDb();
  const rows = await db
    .select({ id: playerGames.id, rangeMin: playerGames.rangeMin, rangeMax: playerGames.rangeMax })
    .from(playerGames)
    .where(and(eq(playerGames.hostGameId, gameId), eq(playerGames.playerId, principalId)))
    .limit(1);

  const playerGameId = rows[0]?.id;
  if (!playerGameId) {
    const error = new DatabaseError('Player game not found');
    logError(error, { action: 'submitGuessAction', gameId, principalId, reason: 'game_not_found' });
    throw error;
  }

  const guessResult = await db.insert(playerGuesses).values({ gameId: playerGameId, value, feedback: res.result });
  if (!guessResult) {
    const error = new DatabaseError('Failed to save guess');
    logError(error, { action: 'submitGuessAction', gameId, principalId, value, reason: 'save_guess_failed' });
    throw error;
  }

  let rangeMin = rows[0]?.rangeMin ?? 1;
  let rangeMax = rows[0]?.rangeMax ?? 10000;

  if (res.result === "low") {
    rangeMin = Math.max(rangeMin, value + 1);
  } else if (res.result === "high") {
    rangeMax = Math.min(rangeMax, value - 1);
  } else if (res.result === "correct") {
    rangeMin = value;
    rangeMax = value;
  }

  const updateResult = await db
    .update(playerGames)
    .set({
    attempts: res.attempts ?? undefined,
    status: res.status === "completed" ? "completed" : "active",
    lastGuessAt: res.lastGuessAt ? new Date(res.lastGuessAt) : new Date(),
    finishedAt: res.finishedAt ? new Date(res.finishedAt) : undefined,
    rangeMin,
    rangeMax,
    })
    .where(eq(playerGames.id, playerGameId));
  
  if (!updateResult) {
    const error = new DatabaseError('Failed to update game state');
    logError(error, { action: 'submitGuessAction', gameId, principalId, reason: 'update_game_failed' });
    throw error;
  }
  
  return res;
}
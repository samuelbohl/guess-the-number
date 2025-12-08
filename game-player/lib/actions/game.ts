"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GameHostClient } from "@/lib/clients/game-host-client";
import type { GameHostSubmitGuessResponse } from "@/lib/types/game-host";
import { getDb } from "@/lib/db/client";
import { playerGames, playerGuesses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function startNewGameAction() {
  const headerList = await headers();
  const token = headerList.get("x-ms-token-aad-id-token");
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }

  const principalId = headerList.get("x-ms-client-principal-id") || "unknown";
  if (!principalId) {
    throw new Error("Missing principal ID in 'x-ms-client-principal-id' header.");
  }

  const client = new GameHostClient(token);
  const created = await client.createGame();

  const db = getDb();
  await db.insert(playerGames).values({
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

  redirect(`/manual/${created.id}`);
}

export async function submitGuessAction(
  gameId: string,
  value: number
): Promise<GameHostSubmitGuessResponse> {
  const headerList = await headers();
  const token = headerList.get("x-ms-token-aad-id-token");
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }

  const principalId = headerList.get("x-ms-client-principal-id") || "unknown";
  if (!principalId) {
    throw new Error("Missing principal ID in 'x-ms-client-principal-id' header.");
  }

  const client = new GameHostClient(token);
  const res = await client.makeGuess(gameId, value);

  // Map host result to player feedback enum
  const feedback: "higher" | "lower" | "correct" =
    res.result === "low" ? "higher" : res.result === "high" ? "lower" : "correct";

  const db = getDb();
  const rows = await db
    .select({ id: playerGames.id, rangeMin: playerGames.rangeMin, rangeMax: playerGames.rangeMax })
    .from(playerGames)
    .where(and(eq(playerGames.hostGameId, gameId), eq(playerGames.playerId, principalId)))
    .limit(1);

  const playerGameId = rows[0]?.id;
  if (!playerGameId) {
    throw new Error("Player game not found.");
  }

  await db.insert(playerGuesses).values({ gameId: playerGameId, value, feedback });

  let rangeMin = rows[0]?.rangeMin ?? 1;
  let rangeMax = rows[0]?.rangeMax ?? 10000;

  if (feedback === "higher") {
    rangeMin = Math.max(rangeMin, value + 1);
  } else if (feedback === "lower") {
    rangeMax = Math.min(rangeMax, value - 1);
  }

  await db
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
  
  return res;
}
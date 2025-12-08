"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GameHostClient } from "@/lib/clients/game-host-client";
import type { GameHostSubmitGuessResponse } from "@/lib/types/game-host";

export async function startNewGameAction() {
  const h = await headers();
  const token = h.get("x-ms-token-aad-id-token");
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  const client = new GameHostClient(token);
  const created = await client.createGame();
  redirect(`/manual/${created.id}`);
}

export async function submitGuessAction(
  gameId: string,
  value: number
): Promise<GameHostSubmitGuessResponse> {
  const h = await headers();
  const token = h.get("x-ms-token-aad-id-token");
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  const client = new GameHostClient(token);
  const res = await client.makeGuess(gameId, value);
  return res;
}
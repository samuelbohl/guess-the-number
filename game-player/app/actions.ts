"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GameHostClient } from "@/clients/game-host-client";

export async function startNewGameAction(_formData: FormData) {
  const h = await headers();
  const token = h.get("x-ms-token-aad-id-token");
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  const client = new GameHostClient(token);
  const created = await client.createGame();
  redirect(`/manual/${created.id}`);
}
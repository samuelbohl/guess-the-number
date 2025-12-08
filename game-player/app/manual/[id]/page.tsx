import { headers } from "next/headers";
import { GameHostClient } from "@/clients/game-host-client";
import GuessTheNumberGame from "@/components/guess-the-number-game";

export const dynamic = "force-dynamic";

export default async function ManualGamePage({ params }: { params: { id: string } }) {
  const h = await headers();
  const token = h.get("x-ms-token-aad-id-token");
  if (!token) {
    throw new Error("Missing AAD ID token in 'x-ms-token-aad-id-token' header.");
  }
  const client = new GameHostClient(token);
  const { id } = await params;
  await client.getGame(id);

  return (
    <main className="min-h-screen bg-background">
      <GuessTheNumberGame initialGameId={id} />
    </main>
  );
}
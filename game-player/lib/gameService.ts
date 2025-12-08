import type { Range } from "@/types/game";

export async function startNewGame(): Promise<{ gameId: string; range: Range }> {
  return Promise.resolve({
    gameId: `game-${Date.now()}`,
    range: { min: 1, max: 10000 },
  });
}

// Placeholder for future API integration
export async function submitGuess(_gameId: string, _guess: number): Promise<void> {
  return Promise.resolve();
}
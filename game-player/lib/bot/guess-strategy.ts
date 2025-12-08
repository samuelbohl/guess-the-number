import type { Range } from '@/lib/types/game';
import type { GameHostSubmitGuessResponse } from '@/lib/types/game-host';

export type GuessResult = GameHostSubmitGuessResponse['result'];
export type GuessRecord = { guess: number; result: GuessResult };

export interface GuessStrategy {
  name: string;
  reset(range: Range): void;
  pick(range: Range, history: GuessRecord[]): number;
}

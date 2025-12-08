import "server-only";

import { GameHostClient } from "@/lib/clients/game-host-client";
import type { Range } from "@/lib/types/game";
import type { GuessRecord, GuessStrategy } from "./GuessStrategy";

export type BotOptions = {
  initialRange?: Range;
  maxAttempts?: number;
};

export type PlayResult = {
  attempts: number;
  history: GuessRecord[];
  status: "completed" | "aborted";
};

export class GuessBot {
  private readonly client: GameHostClient;
  private readonly strategy: GuessStrategy;
  private readonly maxAttempts: number;
  private range: Range;
  private history: GuessRecord[] = [];

  constructor(client: GameHostClient, strategy: GuessStrategy, options?: BotOptions) {
    this.client = client;
    this.strategy = strategy;
    this.range = options?.initialRange || { min: 1, max: 10000 };
    this.maxAttempts = options?.maxAttempts || 256;
    this.strategy.reset(this.range);
  }

  async play(gameId: string, onStep?: (record: GuessRecord, range: Range) => void): Promise<PlayResult> {
    this.history = [];

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const guess = this.sanitizeGuess(this.strategy.pick(this.range, this.history));
      const res = await this.client.makeGuess(gameId, guess);

      const record: GuessRecord = { guess, result: res.result };
      this.history.push(record);

      if (res.result === "low") {
        this.range = { ...this.range, min: Math.max(this.range.min, guess + 1) };
      } else if (res.result === "high") {
        this.range = { ...this.range, max: Math.min(this.range.max, guess - 1) };
      }

      onStep?.(record, this.range);

      if (res.result === "correct") {
        return { attempts: this.history.length, history: this.history.slice(), status: "completed" };
      }

      // If range collapses invalidly, abort
      if (this.range.min > this.range.max) {
        return { attempts: this.history.length, history: this.history.slice(), status: "aborted" };
      }
    }

    return { attempts: this.history.length, history: this.history.slice(), status: "aborted" };
  }

  getRange(): Range {
    return this.range;
  }

  getHistory(): GuessRecord[] {
    return this.history.slice();
  }

  private sanitizeGuess(value: number): number {
    const v = Math.round(value);
    return Math.min(this.range.max, Math.max(this.range.min, v));
  }
}
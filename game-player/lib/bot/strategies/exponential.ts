import type { Range } from '@/lib/types/game';
import type { GuessRecord, GuessStrategy } from '../guess-strategy';

// Exponential search: grow step until overshoot ("high"), then switch to binary.
export class ExponentialSearchStrategy implements GuessStrategy {
  name = 'exponential';
  private step = 1;
  private usingBinary = false;
  reset(_range: Range) {
    this.step = 1;
    this.usingBinary = false;
  }
  pick(range: Range, history: GuessRecord[] = []): number {
    const last = history[history.length - 1];
    if (this.usingBinary) {
      return Math.floor((range.min + range.max) / 2);
    }
    if (!last || last.result === 'low') {
      const guess = Math.min(range.min + this.step, range.max);
      this.step = Math.min(this.step * 2, Math.max(1, range.max - range.min));
      return guess;
    }
    // If we just got "high", we overshot; switch to binary within current range
    this.usingBinary = true;
    return Math.floor((range.min + range.max) / 2);
  }
}

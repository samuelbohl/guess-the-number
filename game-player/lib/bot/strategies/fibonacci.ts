import type { Range } from '@/lib/types/game';
import type { GuessStrategy } from '../guess-strategy';

// Fibonacci/golden-section inspired: partition interval by ~0.618 to shrink efficiently.
export class FibonacciSearchStrategy implements GuessStrategy {
  name = 'fibonacci';
  reset(_range: Range) {}
  pick(range: Range): number {
    const span = range.max - range.min;
    if (span <= 2) {
      return Math.floor((range.min + range.max) / 2);
    }
    const phi = 0.61803398875; // 1/phi
    const offset = Math.round(span * phi);
    return Math.min(range.max, Math.max(range.min, range.min + offset));
  }
}

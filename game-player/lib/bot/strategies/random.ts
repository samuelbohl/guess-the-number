import type { Range } from '@/lib/types/game';
import type { GuessStrategy } from '../guess-strategy';

export class RandomSearchStrategy implements GuessStrategy {
  name = 'random';
  reset(_range: Range) {}
  pick(range: Range): number {
    const min = Math.ceil(range.min);
    const max = Math.floor(range.max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

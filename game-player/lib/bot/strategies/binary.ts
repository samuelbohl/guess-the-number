import type { Range } from '@/lib/types/game';
import type { GuessStrategy } from '../guess-strategy';

export class BinarySearchStrategy implements GuessStrategy {
  name = 'binary';
  reset(_range: Range) {}
  pick(range: Range): number {
    return Math.floor((range.min + range.max) / 2);
  }
}

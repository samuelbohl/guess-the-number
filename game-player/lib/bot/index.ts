import { GuessBot } from './guess-bot';
import type { BotOptions, PlayResult } from './guess-bot';
import type { GuessStrategy, GuessRecord, GuessResult } from './guess-strategy';
import { BinarySearchStrategy } from './strategies/binary';
import { RandomSearchStrategy } from './strategies/random';
import { ExponentialSearchStrategy } from './strategies/exponential';
import { FibonacciSearchStrategy } from './strategies/fibonacci';

export { GuessBot };
export type { BotOptions, PlayResult, GuessStrategy, GuessRecord, GuessResult };
export { BinarySearchStrategy, RandomSearchStrategy, ExponentialSearchStrategy, FibonacciSearchStrategy };

export const Strategies = {
  binary: () => new BinarySearchStrategy(),
  random: () => new RandomSearchStrategy(),
  exponential: () => new ExponentialSearchStrategy(),
  fibonacci: () => new FibonacciSearchStrategy(),
};

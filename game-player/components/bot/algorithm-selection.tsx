'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type BotAlgorithmKey } from '@/lib/actions/bot';
import { Brain, Waypoints, Wand, FunctionSquare } from 'lucide-react';

export type AlgorithmOption = {
  key: BotAlgorithmKey;
  title: string;
  description: string;
  icon: React.ReactNode;
};

type Props = {
  options: AlgorithmOption[];
  selected: BotAlgorithmKey | null;
  onSelect: (key: BotAlgorithmKey) => void;
};

export function AlgorithmSelection({ options, selected, onSelect }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Bot Algorithm</CardTitle>
        <CardDescription>Select which search strategy the bot should use</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {options.map((opt) => (
            <Card
              key={opt.key}
              className={`cursor-pointer transition-all hover:scale-105 hover:border-accent hover:shadow-lg ${
                selected === opt.key ? 'border-primary' : ''
              }`}
              onClick={() => onSelect(opt.key)}
            >
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="mt-1">{opt.icon}</div>
                <div>
                  <CardTitle className="text-lg">{opt.title}</CardTitle>
                  <CardDescription>{opt.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const DEFAULT_ALGORITHM_OPTIONS: AlgorithmOption[] = [
  {
    key: 'binary',
    title: 'Binary Search',
    description: 'Halve the range each step for optimal guesses.',
    icon: <Brain className="h-6 w-6" />,
  },
  {
    key: 'random',
    title: 'Random Search',
    description: 'Guess randomly within the current range.',
    icon: <Wand className="h-6 w-6" />,
  },
  {
    key: 'exponential',
    title: 'Exponential Search',
    description: 'Grow step size until overshoot, then shrink with binary.',
    icon: <Waypoints className="h-6 w-6" />,
  },
  {
    key: 'fibonacci',
    title: 'Fibonacci Search',
    description: 'Partition by golden ratio to narrow efficiently.',
    icon: <FunctionSquare className="h-6 w-6" />,
  },
];
